"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ExternalLink, GitBranch, Star, Search,
  X, Eye, EyeOff, ChevronLeft, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, publicApi } from "@/lib/api";
import type { Project, Tag } from "@/types";
import { cn, formatDate } from "@/lib/utils";

const EMPTY_FORM = {
  title: "", slug: "", short_desc: "", long_desc: "", thumbnail_url: "", github_url: "",
  demo_url: "", status: "published", is_featured: false, display_order: 0, tag_ids: [] as string[],
};

function ProjectForm({ initial, tags, onSave, onClose }: {
  initial?: Partial<typeof EMPTY_FORM> & { id?: string };
  tags: Tag[]; onSave: () => void; onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial, tag_ids: (initial as any)?.tags?.map((t: Tag) => t.id) || [] });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.short_desc) { toast.error("Title and short description are required"); return; }
    setSaving(true);
    try {
      if ((initial as any)?.id) {
        await adminApi.updateProject((initial as any).id, form);
        toast.success("Project updated!");
      } else {
        await adminApi.createProject(form);
        toast.success("Project created!");
      }
      onSave();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save project");
    }
    setSaving(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold">{(initial as any)?.id ? "Edit Project" : "New Project"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="My Awesome Project" required /></div>
            <div><label className="label">Slug (auto-generated)</label><input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-awesome-project" /></div>
          </div>
          <div><label className="label">Short Description *</label><textarea className="input resize-none" rows={2} value={form.short_desc} onChange={(e) => set("short_desc", e.target.value)} placeholder="Brief description (max 300 chars)" maxLength={300} required /></div>
          <div><label className="label">Long Description</label><textarea className="input resize-none" rows={4} value={form.long_desc} onChange={(e) => set("long_desc", e.target.value)} placeholder="Detailed description..." /></div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><label className="label">GitHub URL</label><input className="input" value={form.github_url} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/..." type="url" /></div>
            <div><label className="label">Demo URL</label><input className="input" value={form.demo_url} onChange={(e) => set("demo_url", e.target.value)} placeholder="https://demo.example.com" type="url" /></div>
          </div>
          <div><label className="label">Thumbnail URL</label><input className="input" value={form.thumbnail_url} onChange={(e) => set("thumbnail_url", e.target.value)} placeholder="https://..." type="url" /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div><label className="label">Display Order</label><input className="input" type="number" value={form.display_order} onChange={(e) => set("display_order", parseInt(e.target.value) || 0)} /></div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="w-4 h-4 accent-brand-500" />
                <span className="text-sm text-slate-300">Featured</span>
              </label>
            </div>
          </div>
          {/* Tags */}
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const selected = form.tag_ids.includes(t.id);
                return (
                  <button type="button" key={t.id} onClick={() => set("tag_ids", selected ? form.tag_ids.filter((id: string) => id !== t.id) : [...form.tag_ids, t.id])}
                    className={cn("tag-badge transition-all", selected ? "border" : "border border-transparent bg-white/[0.04] text-slate-400")}
                    style={selected ? { background: `${t.color}20`, color: t.color, borderColor: `${t.color}40` } : {}}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Saving...</> : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
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
      const res = await adminApi.getAllProjects(params);
      setProjects(res.data.data || []);
      setPagination(res.data.pagination);
    } catch {}
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => {
    publicApi.getTags().then((r) => setTags(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteProject(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await adminApi.deleteProject(id);
      toast.success("Project deleted");
      load();
    } catch { toast.error("Failed to delete project"); }
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
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-slate-500 text-sm mt-0.5">{pagination?.total ?? 0} total projects</p>
          </div>
          <button onClick={() => setForm({})} className="btn-primary text-sm"><Plus size={16} />New Project</button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search projects..." />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input text-sm max-w-[160px]">
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 mb-4">No projects found.</p>
              <button onClick={() => setForm({})} className="btn-primary text-sm mx-auto"><Plus size={14} />Create First Project</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.06]">
                  {["Project","Tags","Status","Featured","Date","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.thumbnail_url && <img src={p.thumbnail_url} className="w-10 h-8 rounded object-cover flex-shrink-0" alt="" />}
                          <div>
                            <div className="text-white text-sm font-medium">{p.title}</div>
                            <div className="text-slate-500 text-xs font-mono">{p.slug}</div>
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
                      <td className="px-4 py-3">{p.is_featured ? <Star size={14} className="text-amber-400" fill="currentColor" /> : <span className="text-slate-600 text-xs">—</span>}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(p.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {p.demo_url && <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-brand-400 transition-colors"><ExternalLink size={14} /></a>}
                          {p.github_url && <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-white transition-colors"><GitBranch size={14} /></a>}
                          <button onClick={() => setForm(p)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-blue-400 transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => deleteProject(p.id, p.title)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
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
      {form !== null && <ProjectForm initial={form} tags={tags} onSave={() => { setForm(null); load(); }} onClose={() => setForm(null)} />}
    </AdminLayout>
  );
}
