"use client";
import { useEffect, useState } from "react";
import { Save, Plus, Trash2, Globe, GitBranch, Users, MessageCircle, Link, Eye, EyeOff, Image as ImageIcon, Upload, Terminal } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
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
    <div className="card p-6 sm:p-7 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-slate-900 dark:text-white font-bold text-base">Social Links</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Links displayed in footer, contact, and hero sections.</p>
        </div>
        <span className="text-slate-600 dark:text-slate-400 text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-[var(--border-subtle)]">
          {socials.length} links
        </span>
      </div>
      {loading ? (
        <div className="h-24 animate-pulse bg-slate-100 dark:bg-white/[0.02] border border-[var(--border-subtle)] rounded-xl" />
      ) : (
        <div className="space-y-2.5">
          {socials.map((s) => (
            <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-[var(--border-subtle)] hover:border-[var(--border-color)] transition-colors">
              <span className="text-emerald-500 dark:text-emerald-400 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                {PLATFORM_ICON[s.platform] || <Globe size={15} />}
              </span>
              <div className="w-24 flex-shrink-0">
                <span className="text-slate-900 dark:text-white text-sm font-semibold capitalize block truncate">{s.platform}</span>
                {s.label && <span className="text-slate-500 dark:text-slate-400 text-xs truncate block">{s.label}</span>}
              </div>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 flex-1 truncate font-mono">
                {s.url}
              </a>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button type="button" onClick={() => toggleVisibility(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title={s.is_visible ? "Visible on site" : "Hidden"}>
                  {s.is_visible ? <Eye size={15} className="text-emerald-500 dark:text-emerald-400" /> : <EyeOff size={15} className="text-slate-400 dark:text-slate-500" />}
                </button>
                <button type="button" onClick={() => deleteLink(s.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors" title="Delete Link">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {socials.length === 0 && <p className="text-slate-500 text-xs text-center py-6 border border-dashed border-[var(--border-subtle)] rounded-xl">No social links configured yet.</p>}
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
        <select className="input text-sm sm:w-36 capitalize" value={newLink.platform} onChange={(e) => setNewLink((f) => ({ ...f, platform: e.target.value }))}>
          {PLATFORMS.map((p) => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <input className="input text-sm flex-1" placeholder="URL (e.g. https://github.com/username)" value={newLink.url} onChange={(e) => setNewLink((f) => ({ ...f, url: e.target.value }))} type="url" />
        <input className="input text-sm sm:w-32" placeholder="Custom label" value={newLink.label} onChange={(e) => setNewLink((f) => ({ ...f, label: e.target.value }))} />
        <button type="button" onClick={addLink} disabled={saving} className="btn-primary text-sm px-4 whitespace-nowrap shadow-sm">
          <Plus size={15} />Add Link
        </button>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taglineInput, setTaglineInput] = useState("");
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null);

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

  if (loading) return (
    <AdminLayout>
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Site Settings</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Manage your global profile data, biographies, typewriter taglines, and SEO metadata.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm self-start sm:self-auto shadow-sm">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />Saving...</>
            ) : (
              <><Save size={15} />Save All Changes</>
            )}
          </button>
        </div>

        <div className="space-y-6">
          {/* Header Logo & Brand Identity */}
          <div className="card p-6 sm:p-7 space-y-5">
            <div className="pb-3 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
                  <ImageIcon size={17} className="text-emerald-500 dark:text-emerald-400" />
                  <span>Header Logo & Brand Identity</span>
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Customize the logo image, circular avatar, and brand title shown in your header.</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
                Navbar Brand
              </span>
            </div>

            {/* Live Preview Box */}
            <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-white/[0.02] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-slate-500 text-[11px] font-medium uppercase tracking-wider mb-2">Live Navbar Header Preview</div>
                <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-md">
                  {settings.logo_url ? (
                    <img
                      src={settings.logo_url}
                      alt="Logo preview"
                      className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shadow-sm bg-neutral-950"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                      <Terminal size={15} />
                    </span>
                  )}
                  <span className="font-bold text-slate-900 dark:text-white font-mono text-sm tracking-tight">
                    {settings.logo_text || "irfan.dev"}
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => set("logo_url", "/logo.webp")}
                  className="btn-outline text-xs px-3 py-1.5"
                  title="Use your uploaded avatar portrait as the logo"
                >
                  Use Uploaded Portrait (/logo.webp)
                </button>
                <button
                  type="button"
                  onClick={() => set("logo_url", "")}
                  className="btn-outline text-xs px-3 py-1.5 text-slate-500 dark:text-slate-400"
                  title="Reset to default terminal icon"
                >
                  Reset to Terminal Icon
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label mb-0">Logo Image URL</label>
                  <button
                    type="button"
                    onClick={() => setMediaPickerTarget("logo_url")}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ImageIcon size={13} />
                    <span>Select from Media Library</span>
                  </button>
                </div>
                <input
                  className="input"
                  value={settings.logo_url || ""}
                  onChange={(e) => set("logo_url", e.target.value)}
                  placeholder="e.g. /logo.webp or https://example.com/logo.png"
                />
                <p className="text-slate-500 text-[11px] mt-1.5">
                  Direct image URL, relative path like <code className="text-emerald-600 dark:text-emerald-400 font-mono">/logo.webp</code>, or pick a file below.
                </p>
              </div>
              <div>
                <label className="label">Logo Brand Text</label>
                <input
                  className="input"
                  value={settings.logo_text || ""}
                  onChange={(e) => set("logo_text", e.target.value)}
                  placeholder="e.g. irfan.dev"
                />
                <p className="text-slate-500 text-[11px] mt-1.5">
                  Brand label displayed next to the logo. Default: <code className="text-emerald-600 dark:text-emerald-400 font-mono">irfan.dev</code>
                </p>
              </div>
            </div>

            {/* Upload File to Logo */}
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-white/[0.015] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-slate-900 dark:text-white text-xs font-semibold">Upload Local Image File as Logo</div>
                <div className="text-slate-500 text-[11px]">Select any PNG, JPG, SVG, or WEBP file from your device.</div>
              </div>
              <label className="btn-outline text-xs px-3.5 py-1.5 cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5">
                <Upload size={13} />
                <span>Browse File...</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const base64 = evt.target?.result as string;
                        if (base64) {
                          set("logo_url", base64);
                          toast.success("Logo file loaded! Click Save to apply.");
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="card p-6 sm:p-7 space-y-4">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">Basic Information</h3>
              <p className="text-slate-400 text-xs mt-0.5">Your personal identity and professional career metrics.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={settings.owner_name || ""} onChange={(e) => set("owner_name", e.target.value)} placeholder="e.g. Md Irfan" />
              </div>
              <div>
                <label className="label">Professional Title / Role</label>
                <input className="input" value={settings.owner_title || ""} onChange={(e) => set("owner_title", e.target.value)} placeholder="e.g. Full Stack Developer" />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" value={settings.owner_email || ""} onChange={(e) => set("owner_email", e.target.value)} placeholder="name@domain.com" />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={settings.owner_location || ""} onChange={(e) => set("owner_location", e.target.value)} placeholder="e.g. San Francisco, CA" />
              </div>
              <div>
                <label className="label">Avatar URL</label>
                <input className="input" type="url" value={settings.owner_avatar_url || ""} onChange={(e) => set("owner_avatar_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="label">Resume PDF URL</label>
                <input className="input" type="url" value={settings.owner_resume_url || ""} onChange={(e) => set("owner_resume_url", e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label className="label">Years of Experience</label>
                <input className="input" type="number" min={0} value={settings.about_years_exp ?? 0} onChange={(e) => set("about_years_exp", parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="label">Projects Completed Count</label>
                <input className="input" type="number" min={0} value={settings.about_projects_count ?? 0} onChange={(e) => set("about_projects_count", parseInt(e.target.value) || 0)} />
              </div>
            </div>
          </div>

          {/* Hero / About */}
          <div className="card p-6 sm:p-7 space-y-4">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">Hero & About Section</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Rotating typewriter roles and introductory bios.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Hero Rotating Taglines (Typewriter)</label>
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {(settings.hero_taglines || []).map((t, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                      {t}
                      <button type="button" onClick={() => removeTagline(i)} className="hover:text-red-500 dark:hover:text-red-400 text-slate-400 transition-colors ml-1" title="Remove">
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                  {(settings.hero_taglines || []).length === 0 && (
                    <span className="text-slate-500 text-xs">No rotating taglines added yet.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input className="input text-sm flex-1" placeholder="Add tagline (e.g. Next.js Architect)..." value={taglineInput} onChange={(e) => setTaglineInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTagline())} />
                  <button type="button" onClick={addTagline} className="btn-outline text-xs px-3.5 py-2">
                    <Plus size={14} />Add
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Hero Short Bio</label>
                <textarea className="input resize-none leading-relaxed" rows={2} value={settings.hero_bio_short || ""} onChange={(e) => set("hero_bio_short", e.target.value)} placeholder="Concise tagline below your hero title..." />
              </div>
              <div>
                <label className="label">Detailed About Bio</label>
                <textarea className="input resize-none leading-relaxed" rows={5} value={settings.about_bio || ""} onChange={(e) => set("about_bio", e.target.value)} placeholder="Full biographical description for the About page & section..." />
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="card p-6 sm:p-7 space-y-4">
            <div className="pb-3 border-b border-[var(--border-subtle)]">
              <h3 className="text-slate-900 dark:text-white font-bold text-base">SEO & Metadata</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Search engine indexing and OpenGraph social preview configurations.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Meta Title</label>
                <input className="input" value={settings.meta_title || ""} onChange={(e) => set("meta_title", e.target.value)} placeholder="e.g. Irfan — Full Stack Developer & UI Designer" />
              </div>
              <div>
                <label className="label">Meta Description</label>
                <textarea className="input resize-none leading-relaxed" rows={3} value={settings.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)} placeholder="Summary shown in search engine result snippets..." />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">OpenGraph Social Share Image URL</label>
                  <input className="input" type="url" value={settings.og_image_url || ""} onChange={(e) => set("og_image_url", e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label className="label">Contact Notification Email</label>
                  <input className="input" type="email" value={settings.notify_email || ""} onChange={(e) => set("notify_email", e.target.value)} placeholder="admin@domain.com" />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links */}
          <SocialEditor />
        </div>

        <div className="pt-2 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="btn-primary text-sm px-6 py-2.5 shadow-sm">
            {saving ? (
              <><span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />Saving Settings...</>
            ) : (
              <><Save size={15} />Save All Settings</>
            )}
          </button>
        </div>

        <MediaPickerModal
          isOpen={!!mediaPickerTarget}
          onClose={() => setMediaPickerTarget(null)}
          onSelect={(url) => {
            if (mediaPickerTarget) set(mediaPickerTarget, url);
          }}
          title="Select Image from Media Library"
          defaultType="image"
        />
      </div>
    </AdminLayout>
  );
}
