"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Save } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, publicApi } from "@/lib/api";
import type { SkillCategory } from "@/types";
import { cn, SKILL_LEVEL_MAP } from "@/lib/utils";

const LEVELS = ["beginner","intermediate","advanced","expert"] as const;

export default function AdminSkillsPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCat, setNewCat] = useState("");
  const [editSkill, setEditSkill] = useState<any>(null);
  const [addSkillCat, setAddSkillCat] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState({ name: "", icon_url: "", level: "intermediate" });

  async function load() {
    try {
      const res = await publicApi.getSkills();
      setCategories(res.data.data || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createCategory() {
    if (!newCat.trim()) return;
    try {
      await adminApi.createCategory({ name: newCat.trim(), display_order: categories.length, is_visible: true });
      setNewCat(""); toast.success("Category created"); load();
    } catch { toast.error("Failed to create category"); }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`Delete "${name}" and all its skills?`)) return;
    try { await adminApi.deleteCategory(id); toast.success("Category deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  }

  async function addSkill(categoryId: string) {
    if (!newSkill.name.trim()) { toast.error("Skill name required"); return; }
    try {
      await adminApi.createSkill({ ...newSkill, category_id: categoryId, display_order: 0, is_visible: true });
      setAddSkillCat(null); setNewSkill({ name: "", icon_url: "", level: "intermediate" });
      toast.success("Skill added"); load();
    } catch { toast.error("Failed to add skill"); }
  }

  async function saveSkill() {
    if (!editSkill) return;
    try {
      await adminApi.updateSkill(editSkill.id, { name: editSkill.name, level: editSkill.level, icon_url: editSkill.icon_url, is_visible: editSkill.is_visible });
      setEditSkill(null); toast.success("Skill updated"); load();
    } catch { toast.error("Failed to update skill"); }
  }

  async function deleteSkill(id: string, name: string) {
    if (!confirm(`Delete skill "${name}"?`)) return;
    try { await adminApi.deleteSkill(id); toast.success("Skill deleted"); load(); }
    catch { toast.error("Failed to delete skill"); }
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Skills & Tech Stack</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Organize categories, proficiencies, and icon sets displayed on your portfolio.</p>
          </div>
          <div className="flex gap-2 items-center">
            <input className="input text-sm w-48" placeholder="New category name..." value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()} />
            <button onClick={createCategory} className="btn-primary text-sm whitespace-nowrap shadow-sm">
              <Plus size={15} />Add Category
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-[var(--border-subtle)] animate-pulse" />)}</div>
        ) : categories.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">No skill categories configured yet.</p>
            <div className="flex gap-2 justify-center max-w-sm mx-auto">
              <input className="input text-sm" placeholder="e.g. Frontend Development" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button onClick={createCategory} className="btn-primary text-sm whitespace-nowrap"><Plus size={14} />Create</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.category_id} className="card p-6">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-[var(--border-subtle)]">
                  <h3 className="text-slate-900 dark:text-white font-semibold text-base flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    <span>{cat.category_name}</span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-[var(--border-subtle)]">
                      {cat.skills?.length || 0} skills
                    </span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setAddSkillCat(cat.category_id)} className="btn-outline text-xs px-3 py-1.5">
                      <Plus size={13} />Add Skill
                    </button>
                    <button onClick={() => deleteCategory(cat.category_id, cat.category_name)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Delete Category">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Add skill inline form */}
                {addSkillCat === cat.category_id && (
                  <div className="mb-5 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/25 grid sm:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="label">Skill Name *</label>
                      <input className="input text-sm" value={newSkill.name} onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))} placeholder="e.g. React.js" />
                    </div>
                    <div>
                      <label className="label">Icon URL (optional)</label>
                      <input className="input text-sm" value={newSkill.icon_url} onChange={(e) => setNewSkill((s) => ({ ...s, icon_url: e.target.value }))} placeholder="https://..." type="url" />
                    </div>
                    <div>
                      <label className="label">Proficiency Level</label>
                      <select className="input text-sm capitalize" value={newSkill.level} onChange={(e) => setNewSkill((s) => ({ ...s, level: e.target.value }))}>
                        {LEVELS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addSkill(cat.category_id)} className="btn-primary text-xs flex-1 py-2.5"><Save size={13} />Save</button>
                      <button onClick={() => setAddSkillCat(null)} className="btn-outline text-xs px-3 py-2.5"><X size={13} /></button>
                    </div>
                  </div>
                )}

                {/* Skills list */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.skills?.map((skill) => (
                    <div key={skill.id}>
                      {editSkill?.id === skill.id ? (
                        <div className="card p-3.5 border-emerald-500/40 space-y-2.5 bg-[var(--bg-secondary)] shadow-md">
                          <div>
                            <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Name</label>
                            <input className="input text-xs mt-1" value={editSkill.name} onChange={(e) => setEditSkill((s: any) => ({ ...s, name: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Level</label>
                              <select className="input text-xs mt-1 capitalize" value={editSkill.level} onChange={(e) => setEditSkill((s: any) => ({ ...s, level: e.target.value }))}>
                                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Icon URL</label>
                              <input className="input text-xs mt-1" value={editSkill.icon_url || ""} onChange={(e) => setEditSkill((s: any) => ({ ...s, icon_url: e.target.value }))} placeholder="https://..." type="url" />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={saveSkill} className="btn-primary text-xs py-1.5 flex-1"><Save size={12} />Save</button>
                            <button onClick={() => setEditSkill(null)} className="btn-outline text-xs px-3 py-1.5"><X size={12} /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="card p-3.5 group flex items-center gap-3 hover:border-[var(--border-color)] transition-all">
                          {skill.icon_url ? (
                            <img src={skill.icon_url} className="w-8 h-8 rounded-lg object-contain flex-shrink-0 bg-slate-100 dark:bg-white/[0.02] p-1 border border-[var(--border-subtle)]" alt="" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                              {skill.name[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-slate-900 dark:text-white text-xs font-semibold truncate">{skill.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono capitalize">{skill.level}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.08] mt-1.5 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" style={{ width: `${SKILL_LEVEL_MAP[skill.level] || 50}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            <button onClick={() => setEditSkill(skill)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 hover:text-blue-500 dark:hover:text-blue-400 text-slate-400 transition-colors" title="Edit Skill">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteSkill(skill.id, skill.name)} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-white/5 hover:text-red-500 dark:hover:text-red-400 text-slate-400 transition-colors" title="Delete Skill">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!cat.skills || cat.skills.length === 0) && (
                    <p className="text-slate-500 text-xs col-span-full py-4 text-center border border-dashed border-[var(--border-subtle)] rounded-xl">No skills in this category yet. Click &quot;Add Skill&quot; above.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
