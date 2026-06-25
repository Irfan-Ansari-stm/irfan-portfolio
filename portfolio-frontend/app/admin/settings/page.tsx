"use client";
import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Globe, GitBranch, Users, MessageCircle, Link, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi, publicApi } from "@/lib/api";
import type { SiteSettings, SocialLink } from "@/types";

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  github: <GitBranch size={14} />, linkedin: <Users size={14} />, twitter: <MessageCircle size={14} />,
  website: <Globe size={14} />, instagram: <Globe size={14} />, youtube: <Globe size={14} />, other: <Link size={14} />,
};
const PLATFORMS = ["github","linkedin","twitter","instagram","youtube","website","other"];

function SocialEditor() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLink, setNewLink] = useState({ platform: "github", url: "", label: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    publicApi.getSocialLinks().then((r) => setSocials(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  async function addLink() {
    if (!newLink.url) { toast.error("URL is required"); return; }
    setSaving(true);
    try {
      const res = await adminApi.createSocialLink({ ...newLink, display_order: socials.length, is_visible: true });
      setSocials((s) => [...s, res.data.data]);
      setNewLink({ platform: "github", url: "", label: "" });
      toast.success("Social link added");
    } catch { toast.error("Failed to add link"); }
    setSaving(false);
  }

  async function toggleVisibility(s: SocialLink) {
    try {
      await adminApi.updateSocialLink(s.id, { is_visible: !s.is_visible });
      setSocials((list) => list.map((l) => l.id === s.id ? { ...l, is_visible: !l.is_visible } : l));
    } catch { toast.error("Failed to update"); }
  }

  async function deleteLink(id: string) {
    if (!confirm("Delete this social link?")) return;
    try { await adminApi.deleteSocialLink(id); setSocials((s) => s.filter((l) => l.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed to delete"); }
  }

  return (
    <div className="card p-6">
      <h3 className="text-white font-semibold mb-4">Social Links</h3>
      {loading ? <div className="h-20 animate-pulse bg-white/[0.02] rounded" /> : (
        <div className="space-y-2 mb-4">
          {socials.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <span className="text-brand-400">{PLATFORM_ICON[s.platform]}</span>
              <span className="text-white text-sm capitalize flex-shrink-0 w-20">{s.platform}</span>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 text-xs hover:text-brand-400 flex-1 truncate">{s.url}</a>
              <button onClick={() => toggleVisibility(s)} className="p-1.5 text-slate-500 hover:text-white transition-colors">
                {s.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button onClick={() => deleteLink(s.id)} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
            </div>
          ))}
          {socials.length === 0 && <p className="text-slate-600 text-sm text-center py-4">No social links yet.</p>}
        </div>
      )}
      <div className="flex gap-2">
        <select className="input text-sm max-w-[140px]" value={newLink.platform} onChange={(e) => setNewLink((f) => ({ ...f, platform: e.target.value }))}>
          {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <input className="input text-sm flex-1" placeholder="https://..." value={newLink.url} onChange={(e) => setNewLink((f) => ({ ...f, url: e.target.value }))} type="url" />
        <input className="input text-sm max-w-[120px]" placeholder="Label" value={newLink.label} onChange={(e) => setNewLink((f) => ({ ...f, label: e.target.value }))} />
        <button onClick={addLink} disabled={saving} className="btn-primary text-sm px-4"><Plus size={14} /></button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taglineInput, setTaglineInput] = useState("");

  useEffect(() => {
    publicApi.getSettings()
      .then((r) => {
        setSettings(r.data.data || {});
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: string, v: any) => setSettings((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      toast.success("Settings saved!");
    } catch { toast.error("Failed to save settings"); }
    setSaving(false);
  }

  function addTagline() {
    if (!taglineInput.trim()) return;
    set("hero_taglines", [...(settings.hero_taglines || []), taglineInput.trim()]);
    setTaglineInput("");
  }

  function removeTagline(i: number) {
    set("hero_taglines", (settings.hero_taglines || []).filter((_, idx) => idx !== i));
  }

  if (loading) return <AdminLayout><div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" /></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Site Settings</h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your portfolio&apos;s global settings.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
            {saving ? <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Saving...</> : <><Save size={15} />Save All</>}
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">Basic Information</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="label">Full Name</label><input className="input" value={settings.owner_name || ""} onChange={(e) => set("owner_name", e.target.value)} /></div>
              <div><label className="label">Title / Role</label><input className="input" value={settings.owner_title || ""} onChange={(e) => set("owner_title", e.target.value)} /></div>
              <div><label className="label">Email</label><input className="input" type="email" value={settings.owner_email || ""} onChange={(e) => set("owner_email", e.target.value)} /></div>
              <div><label className="label">Location</label><input className="input" value={settings.owner_location || ""} onChange={(e) => set("owner_location", e.target.value)} /></div>
              <div><label className="label">Avatar URL</label><input className="input" type="url" value={settings.owner_avatar_url || ""} onChange={(e) => set("owner_avatar_url", e.target.value)} /></div>
              <div><label className="label">Resume URL</label><input className="input" type="url" value={settings.owner_resume_url || ""} onChange={(e) => set("owner_resume_url", e.target.value)} /></div>
              <div><label className="label">Years of Experience</label><input className="input" type="number" min={0} value={settings.about_years_exp ?? 0} onChange={(e) => set("about_years_exp", parseInt(e.target.value) || 0)} /></div>
              <div><label className="label">Projects Count</label><input className="input" type="number" min={0} value={settings.about_projects_count ?? 0} onChange={(e) => set("about_projects_count", parseInt(e.target.value) || 0)} /></div>
            </div>
          </div>

          {/* Hero / About */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">Hero & About</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Hero Taglines (Typewriter)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(settings.hero_taglines || []).map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/15 text-brand-400 text-xs">
                      {t}<button onClick={() => removeTagline(i)} className="hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="input text-sm flex-1" placeholder="e.g. React Developer" value={taglineInput} onChange={(e) => setTaglineInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTagline())} />
                  <button onClick={addTagline} className="btn-outline text-xs px-3 py-2"><Plus size={14} /></button>
                </div>
              </div>
              <div><label className="label">Hero Short Bio</label><textarea className="input resize-none" rows={2} value={settings.hero_bio_short || ""} onChange={(e) => set("hero_bio_short", e.target.value)} /></div>
              <div><label className="label">About Bio</label><textarea className="input resize-none" rows={5} value={settings.about_bio || ""} onChange={(e) => set("about_bio", e.target.value)} /></div>
            </div>
          </div>

          {/* SEO */}
          <div className="card p-6">
            <h3 className="text-white font-semibold mb-4">SEO & Meta</h3>
            <div className="space-y-4">
              <div><label className="label">Meta Title</label><input className="input" value={settings.meta_title || ""} onChange={(e) => set("meta_title", e.target.value)} /></div>
              <div><label className="label">Meta Description</label><textarea className="input resize-none" rows={3} value={settings.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)} /></div>
              <div><label className="label">OG Image URL</label><input className="input" type="url" value={settings.og_image_url || ""} onChange={(e) => set("og_image_url", e.target.value)} /></div>
              <div><label className="label">Contact Notification Email</label><input className="input" type="email" value={settings.notify_email || ""} onChange={(e) => set("notify_email", e.target.value)} /></div>
            </div>
          </div>

          {/* Social Links */}
          <SocialEditor />
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Saving...</> : <><Save size={15} />Save Settings</>}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
