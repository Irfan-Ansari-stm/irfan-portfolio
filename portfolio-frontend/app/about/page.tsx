"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin, Mail, Download, Briefcase, GraduationCap, Code2, Award, Heart } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { SiteSettings, Experience, SocialLink } from "@/types";
import { formatDate } from "@/lib/utils";

export default function AboutPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      publicApi.getSettings(),
      publicApi.getExperiences(),
      publicApi.getSocialLinks(),
    ])
      .then(([s, e, sl]) => {
        setSettings(s.data.data);
        setExperiences(e.data.data || []);
        setSocials(sl.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    publicApi.trackEvent("page_view", "/about");
  }, []);

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
            <p className="text-emerald-500 dark:text-brand-400 font-mono text-sm mb-2">// biography & story</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">About Me</h1>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-base leading-relaxed">
              Discover my background, what drives me as an engineer, and the technical philosophy behind the systems I build.
            </p>
          </div>

          {/* Top Profile Card */}
          <div className="card p-8 md:p-10 mb-12 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
                {settings?.owner_avatar_url ? (
                  <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-brand-500/30 shadow-md mb-5">
                    <img
                      src={settings.owner_avatar_url}
                      alt={settings.owner_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-36 h-36 rounded-2xl bg-brand-500/10 border-2 border-brand-500/30 flex items-center justify-center text-4xl mb-5 shadow-sm">
                    👨‍💻
                  </div>
                )}
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{settings?.owner_name || "Irfan Ansari"}</h2>
                <p className="text-emerald-600 dark:text-brand-400 font-medium text-sm mb-4">{settings?.owner_title || "Full Stack Developer"}</p>

                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 mb-6">
                  {settings?.owner_location && (
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-emerald-500 dark:text-brand-400" />
                      <span>{settings.owner_location}</span>
                    </div>
                  )}
                  {settings?.owner_email && (
                    <div className="flex items-center gap-2">
                      <Mail size={15} className="text-emerald-500 dark:text-brand-400" />
                      <a href={`mailto:${settings.owner_email}`} className="hover:text-emerald-500 dark:hover:text-brand-400 transition-colors">
                        {settings.owner_email}
                      </a>
                    </div>
                  )}
                </div>

                {settings?.owner_resume_url && (
                  <a
                    href={settings.owner_resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-xs px-5 py-2.5 shadow-sm"
                    onClick={() => publicApi.trackEvent("resume_download", "/resume")}
                  >
                    <Download size={14} /> Download CV / Resume
                  </a>
                )}
              </div>

              <div className="lg:col-span-8 space-y-6">
                <div>
                  <h3 className="text-slate-900 dark:text-white text-lg font-semibold mb-3">Who I Am & What I Do</h3>
                  <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed space-y-3">
                    {settings?.about_bio ? (
                      settings.about_bio.split("\n").map((p, i) => p && <p key={i}>{p}</p>)
                    ) : (
                      <p>
                        I am a full-stack developer committed to crafting resilient, accessible, and fast web applications.
                        With a deep interest in software architecture and modern toolchains, I bridge intuitive UI design with robust backend engineering.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Highlights Grid */}
                <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-white/[0.06]">
                    <div className="text-2xl font-bold gradient-text mb-1">
                      {settings?.about_years_exp ?? 3}+
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Years Experience</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-white/[0.06]">
                    <div className="text-2xl font-bold gradient-text mb-1">
                      {settings?.about_projects_count ?? 15}+
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Projects Delivered</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-white/[0.06]">
                    <div className="text-2xl font-bold gradient-text mb-1">100%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Commitment to Quality</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Philosophy / Values Section */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <div className="card p-6 card-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 mb-4">
                <Code2 size={20} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-2">Clean Architecture</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Writing testable, maintainable, and type-safe code that scales gracefully from initial MVP to enterprise production.
              </p>
            </div>

            <div className="card p-6 card-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 mb-4">
                <Award size={20} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-2">Performance First</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Optimized database queries, smart caching, minimal bundle sizes, and snappy rendering metrics for seamless user experience.
              </p>
            </div>

            <div className="card p-6 card-hover">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400 mb-4">
                <Heart size={20} />
              </div>
              <h3 className="text-slate-900 dark:text-white font-semibold text-base mb-2">Continuous Learning</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Always sharpening my stack with emerging technologies, modern architectural patterns, and industry best practices.
              </p>
            </div>
          </div>

          {/* Experience & Education Deep Dive */}
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Career Journey & Education</h2>
            <div className="w-10 h-1 bg-brand-500 rounded-full mb-8" />

            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="card p-6 card-hover flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-dark-700 border border-slate-200 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-brand-400 flex-shrink-0 shadow-sm">
                    {exp.type === "work" ? <Briefcase size={20} /> : <GraduationCap size={20} />}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h3 className="text-slate-900 dark:text-white font-semibold text-base">{exp.title}</h3>
                      <span className="text-slate-500 font-mono text-xs">
                        {formatDate(exp.start_date)} — {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : ""}
                      </span>
                    </div>

                    <p className="text-emerald-600 dark:text-brand-400 text-sm font-medium mb-1">{exp.organization}</p>
                    {exp.location && <p className="text-slate-500 text-xs mb-3">{exp.location}</p>}
                    {exp.description && <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{exp.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Banner */}
          <div className="card p-8 text-center bg-gradient-to-r from-emerald-500/10 via-slate-100/70 dark:via-dark-800 to-emerald-500/5 border-emerald-500/20">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Interested in working together?</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto mb-6 text-sm">
              I am open to full-time roles, contracts, and exciting collaborative projects.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="btn-primary text-sm px-6 py-2.5 shadow-sm">
                Get In Touch
              </Link>
              <Link href="/projects" className="btn-outline text-sm px-6 py-2.5">
                Explore My Work
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
