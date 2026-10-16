"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, MapPin, Mail, GitBranch, Users, MessageCircle, Globe, CheckCircle2, Clock, ShieldCheck, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { SiteSettings, SocialLink } from "@/types";

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  github: <GitBranch size={18} />,
  linkedin: <Users size={18} />,
  twitter: <MessageCircle size={18} />,
  website: <Globe size={18} />,
  instagram: <Globe size={18} />,
  youtube: <Globe size={18} />,
  other: <Globe size={18} />,
};

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    publicApi.getSettings().then((r) => setSettings(r.data.data)).catch(() => {});
    publicApi.getSocialLinks().then((r) => setSocials(r.data.data || [])).catch(() => {});
    publicApi.trackEvent("page_view", "/contact");
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
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          {/* Breadcrumb */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-500 dark:hover:text-brand-400 text-sm mb-6 transition-colors"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          {/* Header */}
          <div className="mb-14">
            <p className="text-emerald-500 dark:text-brand-400 font-mono text-sm mb-2">// let&apos;s start a conversation</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">Contact Us</h1>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
            <p className="text-slate-600 dark:text-slate-400 max-w-xl text-base">
              Have a project question, full-time opportunity, or want to say hello? Drop a message below and I&apos;ll get back to you shortly.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-10 mb-16">
            {/* Left Column: Direct Info & Availability */}
            <div className="lg:col-span-2 space-y-6">
              {/* Direct Info Card */}
              <div className="card p-6">
                <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-4">Direct Communication</h3>
                <div className="space-y-4">
                  {settings?.owner_email && (
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 flex-shrink-0">
                        <Mail size={16} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Email Address</div>
                        <a href={`mailto:${settings.owner_email}`} className="text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-brand-400 transition-colors font-medium">
                          {settings.owner_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {settings?.owner_location && (
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 flex-shrink-0">
                        <MapPin size={16} />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Location</div>
                        <span className="text-slate-900 dark:text-white font-medium">{settings.owner_location}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 flex-shrink-0">
                      <Clock size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Response Time</div>
                      <span className="text-slate-900 dark:text-white font-medium">Within 24 Hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Connect */}
              <div className="card p-6">
                <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-4">Professional Networks</h3>
                <div className="flex flex-wrap gap-2.5">
                  {socials.map((s) => (
                    <a
                      key={s.id}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded-xl glass glass-hover flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-brand-400 hover:border-emerald-500/40"
                      aria-label={s.label || s.platform}
                    >
                      {PLATFORM_ICON[s.platform]}
                    </a>
                  ))}
                </div>
              </div>

              {/* Status Card */}
              <div className="card p-6 bg-brand-500/5 border-brand-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-600 dark:text-brand-400 text-sm font-semibold">Available For Hire</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Open to full-time remote roles, consulting engagements, and technical architecture audits.
                </p>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-3">
              <div className="card p-6 sm:p-8">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle2 className="text-emerald-500 dark:text-brand-400" size={32} />
                    </div>
                    <h2 className="text-slate-900 dark:text-white font-bold text-2xl">Message Received!</h2>
                    <p className="text-slate-600 dark:text-slate-400 max-w-md text-sm leading-relaxed">
                      Thank you for reaching out. Your message has been routed to my inbox and I will respond to{" "}
                      <span className="text-emerald-600 dark:text-brand-400 font-medium">{form.email}</span> within 24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ name: "", email: "", subject: "", message: "" });
                      }}
                      className="btn-outline text-sm px-6 py-2.5 mt-4"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="label">Full Name *</label>
                        <input
                          type="text"
                          value={form.name}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, name: e.target.value }));
                            setErrors((er) => ({ ...er, name: "" }));
                          }}
                          className={`input ${errors.name ? "border-red-500/70" : ""}`}
                          placeholder="e.g. Alex Johnson"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1.5">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="label">Email Address *</label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => {
                            setForm((f) => ({ ...f, email: e.target.value }));
                            setErrors((er) => ({ ...er, email: "" }));
                          }}
                          className={`input ${errors.email ? "border-red-500/70" : ""}`}
                          placeholder="e.g. alex@company.com"
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="label">Subject *</label>
                      <input
                        type="text"
                        value={form.subject}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, subject: e.target.value }));
                          setErrors((er) => ({ ...er, subject: "" }));
                        }}
                        className={`input ${errors.subject ? "border-red-500/70" : ""}`}
                        placeholder="e.g. Full Stack Engineering Role / Project Inquiry"
                      />
                      {errors.subject && <p className="text-red-500 text-xs mt-1.5">{errors.subject}</p>}
                    </div>

                    <div>
                      <label className="label">Your Message *</label>
                      <textarea
                        rows={6}
                        value={form.message}
                        onChange={(e) => {
                          setForm((f) => ({ ...f, message: e.target.value }));
                          setErrors((er) => ({ ...er, message: "" }));
                        }}
                        className={`input resize-none ${errors.message ? "border-red-500/70" : ""}`}
                        placeholder="Tell me about your project, timeline, or position requirements..."
                      />
                      {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full justify-center shadow-sm py-3 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <Send size={16} /> Send Message
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-slate-500 text-xs pt-1">
                      <ShieldCheck size={14} className="text-emerald-500 dark:text-brand-400" />
                      <span>Protected with SSL encryption and automated rate-limiting.</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div className="card p-8 md:p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400">
                <HelpCircle size={18} />
              </div>
              <h2 className="text-slate-900 dark:text-white font-bold text-xl">Frequently Asked Questions</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-white/[0.05]">
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">What is your typical turnaround time?</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  I review all incoming inquiries daily and respond within 24-48 business hours with next steps or calendar availability.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-white/[0.05]">
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Are you available for freelance contracts?</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Yes, I take on select freelance projects, MVP development, and architecture reviews depending on scope and scheduling.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-white/[0.05]">
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">What time zones do you work across?</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Based in India (IST, UTC+5:30), with flexible overlapping hours for North American, European, and APAC teams.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/60 border border-slate-200 dark:border-white/[0.05]">
                <h3 className="text-slate-900 dark:text-white font-semibold text-sm mb-2">Can we schedule a call directly?</h3>
                <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                  Send a brief description of your needs through the form above and I will follow up with an invite link for a discovery call.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
