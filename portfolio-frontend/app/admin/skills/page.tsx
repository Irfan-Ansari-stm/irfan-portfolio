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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Skills</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage skill categories and individual skills.</p>
          </div>
          <div className="flex gap-2">
            <input className="input text-sm max-w-[200px]" placeholder="New category name" value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createCategory()} />
            <button onClick={createCategory} className="btn-primary text-sm"><Plus size={14} />Add Category</button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-white/[0.02] animate-pulse" />)}</div>
        ) : categories.length === 0 ? (
          <div className="card p-12 text-center">
            <p className="text-slate-500 mb-4">No skill categories yet.</p>
            <div className="flex gap-2 justify-center">
              <input className="input text-sm max-w-[200px]" placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
              <button onClick={createCategory} className="btn-primary text-sm"><Plus size={14} />Create</button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => (
              <div key={cat.category_id} className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />{cat.category_name}
                    <span className="text-slate-600 text-xs font-mono">({cat.skills?.length || 0})</span>
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setAddSkillCat(cat.category_id)} className="btn-outline text-xs px-3 py-1.5"><Plus size={12} />Add Skill</button>
                    <button onClick={() => deleteCategory(cat.category_id, cat.category_name)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Add skill inline form */}
                {addSkillCat === cat.category_id && (
                  <div className="mb-4 p-4 rounded-lg bg-brand-500/5 border border-brand-500/20 flex gap-2 flex-wrap items-end">
                    <div><label className="label">Name</label><input className="input text-sm" value={newSkill.name} onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))} placeholder="React.js" /></div>
                    <div><label className="label">Icon URL</label><input className="input text-sm" value={newSkill.icon_url} onChange={(e) => setNewSkill((s) => ({ ...s, icon_url: e.target.value }))} placeholder="https://..." type="url" /></div>
                    <div>
                      <label className="label">Level</label>
                      <select className="input text-sm" value={newSkill.level} onChange={(e) => setNewSkill((s) => ({ ...s, level: e.target.value }))}>
                        {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <button onClick={() => addSkill(cat.category_id)} className="btn-primary text-xs px-3 py-2.5 self-end"><Save size={12} />Save</button>
                    <button onClick={() => setAddSkillCat(null)} className="btn-outline text-xs px-3 py-2.5 self-end"><X size={12} />Cancel</button>
                  </div>
                )}

                {/* Skills list */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {cat.skills?.map((skill) => (
                    <div key={skill.id}>
                      {editSkill?.id === skill.id ? (
                        <div className="card p-3 border-brand-500/30 space-y-2">
                          <input className="input text-xs" value={editSkill.name} onChange={(e) => setEditSkill((s: any) => ({ ...s, name: e.target.value }))} />
                          <select className="input text-xs" value={editSkill.level} onChange={(e) => setEditSkill((s: any) => ({ ...s, level: e.target.value }))}>
                            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <input className="input text-xs" value={editSkill.icon_url || ""} onChange={(e) => setEditSkill((s: any) => ({ ...s, icon_url: e.target.value }))} placeholder="Icon URL" type="url" />
                          <div className="flex gap-1">
                            <button onClick={saveSkill} className="btn-primary text-xs px-2 py-1 flex-1"><Save size={10} />Save</button>
                            <button onClick={() => setEditSkill(null)} className="btn-outline text-xs px-2 py-1"><X size={10} /></button>
                          </div>
                        </div>
                      ) : (
                        <div className="card p-3 group flex items-center gap-2">
                          {skill.icon_url ? (
                            <img src={skill.icon_url} className="w-5 h-5 object-contain flex-shrink-0" alt="" />
                          ) : (
                            <div className="w-5 h-5 rounded bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs flex-shrink-0">{skill.name[0]}</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-medium truncate">{skill.name}</div>
                            <div className="h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full" style={{ width: `${SKILL_LEVEL_MAP[skill.level] || 50}%` }} />
                            </div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditSkill(skill)} className="p-1 hover:text-blue-400 text-slate-500 transition-colors"><Pencil size={11} /></button>
                            <button onClick={() => deleteSkill(skill.id, skill.name)} className="p-1 hover:text-red-400 text-slate-500 transition-colors"><Trash2 size={11} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!cat.skills || cat.skills.length === 0) && (
                    <p className="text-slate-600 text-xs col-span-full py-2">No skills yet — click "Add Skill" to add one.</p>
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
