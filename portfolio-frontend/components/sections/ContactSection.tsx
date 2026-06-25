"use client";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { Send, MapPin, Mail, GitBranch, Users, MessageCircle, Globe, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { publicApi } from "@/lib/api";
import type { SiteSettings, SocialLink } from "@/types";

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  github: <GitBranch size={18} />, linkedin: <Users size={18} />, twitter: <MessageCircle size={18} />,
  website: <Globe size={18} />, instagram: <Globe size={18} />, youtube: <Globe size={18} />, other: <Globe size={18} />,
};

export default function ContactSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    publicApi.getSettings().then((r) => setSettings(r.data.data)).catch(() => {});
    publicApi.getSocialLinks().then((r) => setSocials(r.data.data || [])).catch(() => {});
  }, []);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.subject.trim() || form.subject.trim().length < 2) e.subject = "Subject is required";
    if (!form.message.trim() || form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    try {
      await publicApi.submitContact(form);
      setSubmitted(true);
      publicApi.trackEvent("contact_form", "/contact");
      toast.success("Message sent! I'll get back to you soon.");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
      toast.error(msg);
    }
    setSubmitting(false);
  }

  const field = (key: keyof typeof form, label: string, type = "text", rows?: number) => (
    <div>
      <label className="label">{label}</label>
      {rows ? (
        <textarea
          rows={rows}
          value={form[key]}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: "" })); }}
          className={`input resize-none ${errors[key] ? "border-red-500/60" : ""}`}
          placeholder={label}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={(e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((er) => ({ ...er, [key]: "" })); }}
          className={`input ${errors[key] ? "border-red-500/60" : ""}`}
          placeholder={label}
        />
      )}
      {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  return (
    <section id="contact" className="py-24 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`mb-12 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-brand-400 font-mono text-sm mb-2">// let's talk</p>
          <h2 className="section-title">Get In Touch</h2>
          <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
          <p className="section-subtitle">Have a project in mind or want to collaborate? I'd love to hear from you.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className={`lg:col-span-2 space-y-6 transition-all duration-700 delay-100 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">Contact Info</h3>
              <div className="space-y-4">
                {settings?.owner_location && (
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <MapPin size={15} />
                    </div>
                    <span>{settings.owner_location}</span>
                  </div>
                )}
                {settings?.owner_email && (
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                    <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 flex-shrink-0">
                      <Mail size={15} />
                    </div>
                    <a href={`mailto:${settings.owner_email}`} className="hover:text-brand-400 transition-colors">
                      {settings.owner_email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-white font-semibold mb-4">Find Me On</h3>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center text-slate-400 hover:text-brand-400"
                    aria-label={s.label || s.platform}>
                    {PLATFORM_ICON[s.platform]}
                  </a>
                ))}
              </div>
            </div>

            <div className="card p-6 bg-brand-500/5 border-brand-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                <span className="text-brand-400 text-sm font-medium">Available for work</span>
              </div>
              <p className="text-slate-400 text-sm">Currently open to freelance projects and full-time opportunities.</p>
            </div>
          </div>

          {/* Form */}
          <div className={`lg:col-span-3 transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <div className="card p-6">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center">
                    <CheckCircle className="text-brand-400" size={32} />
                  </div>
                  <h3 className="text-white font-bold text-xl">Message Sent!</h3>
                  <p className="text-slate-400">Thanks for reaching out. I'll get back to you within 24-48 hours.</p>
                  <button onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                    className="btn-outline text-sm px-5 py-2 mt-2">
                    Send Another
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {field("name", "Full Name")}
                    {field("email", "Email Address", "email")}
                  </div>
                  {field("subject", "Subject")}
                  {field("message", "Message", "text", 5)}
                  <button type="submit" disabled={submitting}
                    className="btn-primary w-full justify-center shadow-glow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? (
                      <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Sending...</>
                    ) : (
                      <><Send size={16} />Send Message</>
                    )}
                  </button>
                  <p className="text-slate-600 text-xs text-center">
                    Rate limited to 3 submissions per hour. I typically respond within 24 hours.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
