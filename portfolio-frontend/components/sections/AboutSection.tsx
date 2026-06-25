"use client";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { MapPin, Mail, Calendar, Code2, Briefcase, GraduationCap } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { SiteSettings, Experience } from "@/types";
import { formatDate } from "@/lib/utils";

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card p-5 text-center card-hover">
      <div className="text-3xl font-bold gradient-text mb-1">{value}+</div>
      <div className="text-slate-400 text-xs font-medium uppercase tracking-wide">{label}</div>
    </div>
  );
}

const EXP_ICON: Record<string, React.ReactNode> = {
  work: <Briefcase size={14} />,
  education: <GraduationCap size={14} />,
  certification: <Code2 size={14} />,
  achievement: <Calendar size={14} />,
};

export default function AboutSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    Promise.all([
      publicApi.getSettings(),
      publicApi.getExperiences(),
    ]).then(([s, e]) => {
      setSettings(s.data.data);
      setExperiences(e.data.data || []);
    }).catch(() => {});
  }, []);

  return (
    <section id="about" className="py-24 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className={`mb-14 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-brand-400 font-mono text-sm mb-2">// about me</p>
          <h2 className="section-title">Who I Am</h2>
          <div className="w-12 h-1 bg-brand-500 rounded-full" />
        </div>

        <div className="grid lg:grid-cols-2 gap-14 items-start">
          {/* Left — Bio */}
          <div className={`transition-all duration-700 delay-100 ${inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"}`}>
            {settings?.owner_avatar_url && (
              <div className="relative mb-8 inline-block">
                <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-brand-500/30 shadow-glow-sm">
                  <img src={settings.owner_avatar_url} alt={settings.owner_name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-dark-900 text-lg animate-glow-pulse">
                  👨‍💻
                </span>
              </div>
            )}

            <div className="prose prose-sm max-w-none text-slate-400 mb-6 leading-relaxed">
              {settings?.about_bio
                ? settings.about_bio.split("\n").map((p, i) => p && <p key={i}>{p}</p>)
                : <p>Passionate Full Stack Developer building modern web applications with React and Node.js.</p>
              }
            </div>

            {/* Meta info */}
            <div className="flex flex-col gap-2 mb-8">
              {settings?.owner_location && (
                <div className="flex items-center gap-2.5 text-slate-400 text-sm">
                  <MapPin size={14} className="text-brand-400 flex-shrink-0" />
                  {settings.owner_location}
                </div>
              )}
              {settings?.owner_email && (
                <div className="flex items-center gap-2.5 text-slate-400 text-sm">
                  <Mail size={14} className="text-brand-400 flex-shrink-0" />
                  <a href={`mailto:${settings.owner_email}`} className="hover:text-brand-400 transition-colors">
                    {settings.owner_email}
                  </a>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard value={settings?.about_years_exp ?? 1} label="Years Experience" />
              <StatCard value={settings?.about_projects_count ?? 0} label="Projects Built" />
            </div>
          </div>

          {/* Right — Timeline */}
          <div className={`transition-all duration-700 delay-200 ${inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"}`}>
            <h3 className="text-white font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-1 h-5 bg-brand-500 rounded-full" />
              Experience & Education
            </h3>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-brand-500/60 via-brand-500/20 to-transparent" />

              <div className="space-y-5">
                {experiences.length === 0
                  ? [1, 2, 3].map((i) => (
                    <div key={i} className="h-24 rounded-xl bg-white/[0.02] animate-pulse ml-12" />
                  ))
                  : experiences.slice(0, 5).map((exp, idx) => (
                    <div key={exp.id} className={`relative flex gap-4 transition-all duration-500`} style={{ transitionDelay: `${idx * 80}ms` }}>
                      {/* Dot */}
                      <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-xl bg-dark-700 border border-white/10 flex items-center justify-center text-brand-400">
                        {EXP_ICON[exp.type]}
                      </div>
                      {/* Content */}
                      <div className="card p-4 flex-1 card-hover">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-white font-semibold text-sm">{exp.title}</h4>
                          {exp.is_current && (
                            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-brand-400/80 text-xs font-medium mb-1">{exp.organization}</p>
                        {exp.location && <p className="text-slate-500 text-xs">{exp.location}</p>}
                        <p className="text-slate-600 text-xs mt-1.5 font-mono">
                          {formatDate(exp.start_date)} — {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : ""}
                        </p>
                        {exp.description && (
                          <p className="text-slate-400 text-xs mt-2 leading-relaxed line-clamp-2">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
