"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Briefcase, GraduationCap, Award } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { Experience } from "@/types";
import { formatDate, cn } from "@/lib/utils";

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  work: { label: "Work Experience", icon: <Briefcase size={16} />, color: "#22c55e" },
  education: { label: "Education", icon: <GraduationCap size={16} />, color: "#3b82f6" },
  certification: { label: "Certifications", icon: <Award size={16} />, color: "#a855f7" },
  achievement: { label: "Achievements", icon: <Award size={16} />, color: "#f59e0b" },
};

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [activeType, setActiveType] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getExperiences()
      .then((r) => setExperiences(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    publicApi.trackEvent("page_view", "/experience");
  }, []);

  const filtered = activeType === "all" ? experiences : experiences.filter((e) => e.type === activeType);

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
          <div className="mb-12">
            <p className="text-emerald-500 dark:text-brand-400 font-mono text-sm mb-2">// career & qualifications</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">Experience & Education</h1>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
            <p className="text-slate-600 dark:text-slate-400 max-w-xl text-base">
              A comprehensive timeline of professional roles, software engineering initiatives, degrees, and certificates.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 mb-10">
            {["all", "work", "education", "certification"].map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize",
                  activeType === type
                    ? "bg-brand-500 text-dark-900"
                    : "glass text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                {type === "all" ? "All Credentials" : TYPE_CONFIG[type]?.label || type}
              </button>
            ))}
          </div>

          {/* Timeline Cards */}
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-xl bg-slate-100 dark:bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 card">
              <p className="text-slate-600 dark:text-slate-400 text-base mb-1">No entries found for this category.</p>
              <p className="text-slate-500 text-xs">Switch to &quot;All Credentials&quot; to view everything.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical guideline */}
              <div className="absolute left-6 md:left-8 top-4 bottom-4 w-px bg-gradient-to-b from-brand-500/80 via-brand-500/20 to-transparent" />

              <div className="space-y-8">
                {filtered.map((item) => {
                  const conf = TYPE_CONFIG[item.type] || TYPE_CONFIG.work;
                  return (
                    <div key={item.id} className="relative flex items-start gap-6 md:gap-8 group">
                      {/* Timeline Node */}
                      <div className="relative z-10 flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-emerald-600 dark:text-brand-400 shadow-md group-hover:border-emerald-500/40 group-hover:scale-105 transition-all">
                        {conf.icon}
                      </div>

                      {/* Content Card */}
                      <div className="card p-6 md:p-7 flex-1 card-hover">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h2 className="text-slate-900 dark:text-white font-bold text-lg">{item.title}</h2>
                              {item.is_current && (
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-brand-400 font-mono font-medium border border-emerald-500/30">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-emerald-600 dark:text-brand-400 text-sm font-semibold mt-0.5">{item.organization}</p>
                          </div>
                          <span className="text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                            {formatDate(item.start_date)} — {item.is_current ? "Present" : item.end_date ? formatDate(item.end_date) : ""}
                          </span>
                        </div>

                        {item.location && (
                          <div className="text-slate-500 text-xs mb-3 font-medium">
                            {item.location}
                          </div>
                        )}

                        {item.description && (
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line mb-3">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
