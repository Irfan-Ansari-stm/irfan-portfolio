"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Eye, CheckCircle, Search, ChevronLeft, ChevronRight, Clock, X, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { adminApi, publicApi } from "@/lib/api";
import type { BlogPost, Tag } from "@/types";
import { cn, formatDate } from "@/lib/utils";

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
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showContentMediaPicker, setShowContentMediaPicker] = useState(false);
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
      <div className="modal-dialog w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold">{(initial as any)?.id ? "Edit Post" : "New Post"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Post title" required />
            </div>
            <div>
              <label className="label">Slug (auto-generated)</label>
              <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="post-slug" />
            </div>
          </div>
          <div>
            <label className="label">Excerpt *</label>
            <textarea className="input resize-none" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Short summary (max 500 chars)" maxLength={500} required />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Cover Image URL</label>
              <button
                type="button"
                onClick={() => setShowCoverPicker(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <ImageIcon size={13} />
                <span>Select from Media Library</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                value={form.cover_image_url}
                onChange={(e) => set("cover_image_url", e.target.value)}
                placeholder="https://..."
                type="url"
              />
              {form.cover_image_url && (
                <img
                  src={form.cover_image_url}
                  alt="Cover preview"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-white/10 flex-shrink-0 bg-slate-100 dark:bg-neutral-900"
                />
              )}
            </div>
            <MediaPickerModal
              isOpen={showCoverPicker}
              onClose={() => setShowCoverPicker(false)}
              onSelect={(url) => set("cover_image_url", url)}
              title="Select Blog Post Cover Image"
              defaultType="image"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Content (Markdown)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowContentMediaPicker(true)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20"
                >
                  <ImageIcon size={13} />
                  <span>Insert Media</span>
                </button>
                <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
                  ~{estimateRead(form.content || "")} min read
                </span>
              </div>
            </div>
            <textarea
              className="input resize-none font-mono text-sm leading-relaxed"
              rows={12}
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="# My Post&#10;&#10;Write your content in Markdown..."
            />
            <MediaPickerModal
              isOpen={showContentMediaPicker}
              onClose={() => setShowContentMediaPicker(false)}
              onSelect={(url) => {
                const isVideo = url.endsWith(".mp4") || url.endsWith(".webm") || url.endsWith(".mov");
                const snippet = isVideo
                  ? `\n\n<video src="${url}" controls width="100%"></video>\n\n`
                  : `\n\n![Image](${url})\n\n`;
                set("content", (form.content || "") + snippet);
                toast.success("Media inserted into content!");
              }}
              title="Insert Media into Post Content"
              defaultType="all"
            />
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
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1 p-2 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl">
                {tags.map((t) => {
                  const sel = form.tag_ids.includes(t.id);
                  return (
                    <button key={t.id} type="button" onClick={() => set("tag_ids", sel ? form.tag_ids.filter((id: string) => id !== t.id) : [...form.tag_ids, t.id])}
                      className={cn("tag-badge cursor-pointer transition-all", sel ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-[var(--bg-modal)]" : "opacity-60 hover:opacity-100")}
                      style={{ background: `${t.color}20`, color: t.color }}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-outline text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm shadow-sm">{saving ? "Saving..." : "Save Post"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      const res = await adminApi.getPosts(params);
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
    const map: Record<string, string> = {
      published: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      draft: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      archived: "text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20"
    };
    return <span className={cn("status-badge", map[s] || "text-slate-400 bg-slate-500/10 border-slate-500/20")}>{s}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Blog Posts</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">{pagination?.total ?? 0} total posts published & drafted</p>
          </div>
          <button onClick={() => setForm({})} className="btn-primary text-sm self-start sm:self-auto shadow-sm">
            <Plus size={16} />New Post
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search posts..." />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input text-sm sm:w-44">
            <option value="all">All Statuses</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
          ) : posts.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">No blog posts found matching your criteria.</p>
              <button onClick={() => setForm({})} className="btn-primary text-sm mx-auto"><Plus size={14} />Write First Post</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                    {["Post", "Tags", "Status", "Read Time", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.04]">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          {p.cover_image_url ? (
                            <img src={p.cover_image_url} className="w-11 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-white/10 shadow-sm" alt="" />
                          ) : (
                            <div className="w-11 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                              <FileText size={15} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-slate-900 dark:text-white text-sm font-semibold line-clamp-1 max-w-xs">{p.title}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono line-clamp-1 max-w-xs">{p.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {p.tags?.slice(0, 2).map((t) => (
                            <span key={t.id} className="tag-badge text-xs" style={{ background: `${t.color}15`, color: t.color }}>
                              {t.label}
                            </span>
                          ))}
                          {(p.tags?.length || 0) > 2 && (
                            <span className="text-slate-500 text-xs self-center font-mono">+{p.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">{statusBadge(p.status)}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                          <Clock size={12} className="text-slate-400 dark:text-slate-500" />
                          {p.reading_time_mins} min
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{p.published_at ? formatDate(p.published_at) : "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {p.status === "published" && (
                            <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="View Public Post">
                              <Eye size={15} />
                            </a>
                          )}
                          {p.status === "draft" && (
                            <button onClick={() => publishPost(p.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Publish Post Now">
                              <CheckCircle size={15} />
                            </button>
                          )}
                          <button onClick={() => setForm(p)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-blue-500 transition-colors" title="Edit Post">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deletePost(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Post">
                            <Trash2 size={15} />
                          </button>
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
