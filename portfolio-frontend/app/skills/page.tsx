"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Code, Server, Database, Terminal, Cpu, Layers } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { publicApi } from "@/lib/api";
import type { SkillCategory } from "@/types";
import { SKILL_LEVEL_MAP, SKILL_LEVEL_LABEL, cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Frontend: <Code size={18} />,
  Backend: <Server size={18} />,
  Database: <Database size={18} />,
  Languages: <Terminal size={18} />,
  Tools: <Layers size={18} />,
  "DevOps & Tools": <Cpu size={18} />,
};

export default function SkillsPage() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi
      .getSkills()
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    publicApi.trackEvent("page_view", "/skills");
  }, []);

  const totalSkillsCount = categories.reduce((acc, c) => acc + (c.skills?.length || 0), 0);

  const filteredCategories = categories
    .filter((c) => activeCategory === "all" || c.category_id === activeCategory)
    .map((c) => ({
      ...c,
      skills: (c.skills || []).filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase().trim())
      ),
    }))
    .filter((c) => c.skills.length > 0);

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
            <p className="text-emerald-500 dark:text-brand-400 font-mono text-sm mb-2">// technical stack</p>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-3">Skills & Technologies</h1>
            <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
            <p className="text-slate-600 dark:text-slate-400 max-w-xl text-base">
              A comprehensive breakdown of frameworks, databases, and tooling I use to architect end-to-end applications.
            </p>
          </div>

          {/* Highlights Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{totalSkillsCount}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Technologies Mastered</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">{categories.length}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Specialized Domains</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">TypeScript</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Primary Language</div>
            </div>
            <div className="card p-5 text-center">
              <div className="text-3xl font-bold gradient-text mb-1">Next.js & Node</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Core Stack</div>
            </div>
          </div>

          {/* Search + Category Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 text-sm"
                placeholder="Search specific skill..."
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm",
                  activeCategory === "all"
                    ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                    : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40"
                )}
              >
                All Domains
              </button>
              {categories.map((c) => (
                <button
                  key={c.category_id}
                  onClick={() => setActiveCategory(c.category_id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm",
                    activeCategory === c.category_id
                      ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                      : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40"
                  )}
                >
                  {c.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* Categories & Skills Sections */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-slate-100 dark:bg-white/[0.02] animate-pulse" />
              ))}
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16 card">
              <p className="text-slate-600 dark:text-slate-400 text-base mb-1">No technologies match your search.</p>
              <p className="text-slate-500 text-xs">Try searching for React, Node, SQL, or Docker.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((cat) => (
                <div key={cat.category_id} className="card p-6 md:p-8">
                  <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-white/[0.06]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-brand-400">
                        {CATEGORY_ICONS[cat.category_name] || <Code size={18} />}
                      </div>
                      <h2 className="text-slate-900 dark:text-white font-bold text-lg">{cat.category_name}</h2>
                    </div>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {cat.skills.length} {cat.skills.length === 1 ? "technology" : "technologies"}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {cat.skills.map((skill) => {
                      const percent = SKILL_LEVEL_MAP[skill.level] || 60;
                      return (
                        <div key={skill.id} className="p-4 rounded-xl bg-slate-50 dark:bg-dark-800/80 border border-slate-200 dark:border-white/[0.06] card-hover">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{skill.name}</span>
                            <span className="text-xs font-mono text-emerald-600 dark:text-brand-400">
                              {SKILL_LEVEL_LABEL[skill.level] || skill.level}
                            </span>
                          </div>
                          <div className="skill-bar-track mt-2">
                            <div className="skill-bar-fill" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Bottom Card */}
          <div className="card p-8 mt-14 text-center bg-gradient-to-r from-emerald-500/10 via-slate-100/70 dark:via-dark-800 to-transparent border-emerald-500/20">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Need a tailored technical solution?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-xl mx-auto mb-6">
              Whether building a full-stack platform from scratch or optimizing existing infrastructure, I can help.
            </p>
            <Link href="/contact" className="btn-primary text-sm px-6 py-2.5 shadow-sm">
              Let&apos;s Build Together
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
