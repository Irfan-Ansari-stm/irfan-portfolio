"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Plus, Pencil, Trash2, ExternalLink, GitBranch, Star, Search,
  X, ChevronLeft, ChevronRight, FolderKanban, Image as ImageIcon
} from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
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
  const [showMediaPicker, setShowMediaPicker] = useState(false);

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
      <div className="modal-dialog w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold">{(initial as any)?.id ? "Edit Project" : "New Project"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Title *</label>
              <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="My Awesome Project" required />
            </div>
            <div>
              <label className="label">Slug (auto-generated)</label>
              <input className="input" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="my-awesome-project" />
            </div>
          </div>
          <div>
            <label className="label">Short Description *</label>
            <textarea className="input resize-none" rows={2} value={form.short_desc || ""} onChange={(e) => set("short_desc", e.target.value)} placeholder="Brief description (max 300 chars)" maxLength={300} required />
          </div>
          <div>
            <label className="label">Long Description</label>
            <textarea className="input resize-none" rows={4} value={form.long_desc || ""} onChange={(e) => set("long_desc", e.target.value)} placeholder="Detailed description..." />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">GitHub URL</label>
              <input className="input" value={form.github_url || ""} onChange={(e) => set("github_url", e.target.value)} placeholder="https://github.com/..." type="url" />
            </div>
            <div>
              <label className="label">Demo URL</label>
              <input className="input" value={form.demo_url || ""} onChange={(e) => set("demo_url", e.target.value)} placeholder="https://demo.example.com" type="url" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">Thumbnail URL</label>
              <button
                type="button"
                onClick={() => setShowMediaPicker(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <ImageIcon size={13} />
                <span>Select from Media Library</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="input flex-1"
                value={form.thumbnail_url}
                onChange={(e) => set("thumbnail_url", e.target.value)}
                placeholder="https://..."
                type="url"
              />
              {form.thumbnail_url && (
                <img
                  src={form.thumbnail_url}
                  alt="Thumbnail preview"
                  className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-white/10 flex-shrink-0 bg-slate-100 dark:bg-neutral-900"
                />
              )}
            </div>
            <MediaPickerModal
              isOpen={showMediaPicker}
              onClose={() => setShowMediaPicker(false)}
              onSelect={(url) => set("thumbnail_url", url)}
              title="Select Project Thumbnail"
              defaultType="image"
            />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="label">Display Order</label>
              <input className="input" type="number" value={form.display_order} onChange={(e) => set("display_order", parseInt(e.target.value) || 0)} />
            </div>
            <div className="pb-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => set("is_featured", e.target.checked)} className="w-4 h-4 accent-emerald-500 rounded" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Featured</span>
              </label>
            </div>
          </div>
          {/* Tags */}
          <div>
            <label className="label">Tags</label>
            <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl">
              {tags.map((t) => {
                const selected = form.tag_ids.includes(t.id);
                return (
                  <button key={t.id} type="button" onClick={() => {
                    set("tag_ids", selected ? form.tag_ids.filter((id: string) => id !== t.id) : [...form.tag_ids, t.id]);
                  }} className={cn("tag-badge cursor-pointer transition-all", selected ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-[var(--bg-modal)]" : "opacity-60 hover:opacity-100")}
                  style={{ background: `${t.color}20`, color: t.color }}>
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
            <button type="button" onClick={onClose} className="btn-outline text-sm">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary text-sm shadow-sm">{saving ? "Saving..." : "Save Project"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
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
      const [pres, tres] = await Promise.all([adminApi.getProjects(params), publicApi.getTags()]);
      setProjects(pres.data.data || []);
      setPagination(pres.data.pagination);
      setTags(tres.data.data || []);
    } catch {}
    setLoading(false);
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  async function deleteProject(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await adminApi.deleteProject(id);
      toast.success("Project deleted");
      load();
    } catch { toast.error("Failed to delete project"); }
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Projects</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">{pagination?.total ?? 0} total projects in database</p>
          </div>
          <button onClick={() => setForm({})} className="btn-primary text-sm self-start sm:self-auto shadow-sm">
            <Plus size={16} />New Project
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search projects..." />
          </div>
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input text-sm sm:w-44">
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-4 text-sm">No projects found matching your criteria.</p>
              <button onClick={() => setForm({})} className="btn-primary text-sm mx-auto"><Plus size={14} />Create First Project</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                    {["Project", "Tags", "Status", "Featured", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.04]">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3.5">
                          {p.thumbnail_url ? (
                            <img src={p.thumbnail_url} className="w-11 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-white/10 shadow-sm" alt="" />
                          ) : (
                            <div className="w-11 h-9 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                              <FolderKanban size={15} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-xs">{p.title}</div>
                            <div className="text-slate-500 dark:text-slate-400 text-xs font-mono truncate max-w-xs">{p.slug}</div>
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
                            <span className="text-slate-600 dark:text-slate-400 text-xs self-center font-mono">+{p.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">{statusBadge(p.status)}</td>
                      <td className="px-5 py-4">
                        {p.is_featured ? (
                          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                            <Star size={13} fill="currentColor" /> Featured
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(p.created_at)}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          {p.demo_url && (
                            <a href={p.demo_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Live Demo">
                              <ExternalLink size={15} />
                            </a>
                          )}
                          {p.github_url && (
                            <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Source Code">
                              <GitBranch size={15} />
                            </a>
                          )}
                          <button onClick={() => setForm(p)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-blue-500 transition-colors" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => deleteProject(p.id, p.title)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
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
