"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, CheckCircle, Search, ChevronLeft, ChevronRight, Clock, X } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, publicApi } from "@/lib/api";
import type { BlogPost, Tag } from "@/types";
import { cn, formatDate, estimateReadingTime } from "@/lib/utils";

function estimateRead(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}

function PostForm({ initial, tags, onSave, onClose }: {
  initial?: Partial<BlogPost>; tags: Tag[]; onSave: () => void; onClose: () => void;
}) {
  const initialTagIds = (initial as any)?.tags?.map((t: Tag) => t.id) || [];
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", cover_image_url: "",
    status: "draft", tag_ids: initialTagIds as string[],
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.excerpt) { toast.error("Title and excerpt are required"); return; }
    setSaving(true);
    try {
      const payload = { ...form, reading_time_mins: estimateRead(form.content || "") };
      if ((initial as any)?.id) { await adminApi.updatePost((initial as any).id, payload); toast.success("Post updated!"); }
      else { await adminApi.createPost(payload); toast.success("Post created!"); }
      onSave();
    } catch (err: any) { toast.error(err?.response?.data?.message || "Failed to save post"); }
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold">{(initial as any)?.id ? "Edit Post" : "New Post"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Post title" required /></div>
            <div><label className="label">Slug (auto-generated)</label><input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="post-slug" /></div>
          </div>
          <div><label className="label">Excerpt *</label><textarea className="input resize-none" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary (max 500 chars)" maxLength={500} required /></div>
          <div><label className="label">Cover Image URL</label><input className="input" value={form.cover_image_url} onChange={(e) => set("cover_image_url", e.target.value)} placeholder="https://..." type="url" /></div>
          <div>
            <label className="label">Content (Markdown)</label>
            <textarea className="input resize-none font-mono text-sm" rows={12} value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="# My Post&#10;&#10;Write your content in Markdown..." />
            <p className="text-slate-600 text-xs mt-1 font-mono">~{estimateRead(form.content || "")} min read</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="label">Tags</label>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {tags.map((t) => {
                  const sel = form.tag_ids.includes(t.id);
                  return <button type="button" key={t.id} onClick={() => set("tag_ids", sel ? form.tag_ids.filter((id: string) => id !== t.id) : [...form.tag_ids, t.id])}
                    className={cn("tag-badge text-xs transition-all", sel ? "border" : "border border-transparent bg-white/[0.04] text-slate-400")}
                    style={sel ? { background: `${t.color}20`, color: t.color, borderColor: `${t.color}40` } : {}}>{t.label}</button>;
                })}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Saving...</> : "Save Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const res = await adminApi.getAllPosts(params);
      setPosts(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    publicApi.getTags().then((r) => setTags(r.data.data || [])).catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  async function deletePost(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try { await adminApi.deletePost(id); toast.success("Post deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  }

  async function publishPost(id: string) {
    try { await adminApi.publishPost(id); toast.success("Post published!"); load(); }
    catch { toast.error("Failed to publish"); }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { published: "text-brand-400 bg-brand-500/15", draft: "text-amber-400 bg-amber-500/15", archived: "text-slate-400 bg-slate-500/15" };
    return <span className={cn("status-badge", map[s])}>{s}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Blog Posts</h1>
            <p className="text-slate-500 text-sm mt-0.5">{pagination?.total ?? 0} total posts</p>
          </div>
          <button onClick={() => setForm({})} className="btn-primary text-sm"><Plus size={16} />New Post</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search posts..." />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input text-sm max-w-[160px]">
            <option value="all">All</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 mb-4">No posts found.</p>
              <button onClick={() => setForm({})} className="btn-primary text-sm mx-auto"><Plus size={14} />Write First Post</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.06]">
                  {["Post","Tags","Status","Read Time","Date","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.cover_image_url && <img src={p.cover_image_url} className="w-10 h-8 rounded object-cover flex-shrink-0" alt="" />}
                          <div>
                            <div className="text-white text-sm font-medium line-clamp-1">{p.title}</div>
                            <div className="text-slate-500 text-xs font-mono line-clamp-1">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.tags?.slice(0, 2).map((t) => <span key={t.id} className="tag-badge text-xs" style={{ background: `${t.color}15`, color: t.color }}>{t.label}</span>)}
                          {(p.tags?.length || 0) > 2 && <span className="text-slate-500 text-xs">+{p.tags.length - 2}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">{statusBadge(p.status)}</td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1 text-slate-400 text-xs"><Clock size={11} />{p.reading_time_mins}m</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{p.published_at ? formatDate(p.published_at) : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.status === "published" && (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-brand-400 transition-colors"><Eye size={14} /></a>
                          )}
                          {p.status === "draft" && (
                            <button onClick={() => publishPost(p.id)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-brand-400 transition-colors" title="Publish"><CheckCircle size={14} /></button>
                          )}
                          <button onClick={() => setForm(p)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => deletePost(p.id, p.title)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-500 text-xs">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
      {form !== null && <PostForm initial={form} tags={tags} onSave={() => { setForm(null); load(); }} onClose={() => setForm(null)} />}
    </AdminLayout>
  );
}
