"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { publicApi } from "@/lib/api";
import type { SkillCategory } from "@/types";
import { SKILL_LEVEL_MAP, cn } from "@/lib/utils";

function SkillBar({ level, inView }: { level: string; inView: boolean }) {
  const width = SKILL_LEVEL_MAP[level] || 50;
  return (
    <div className="skill-bar-track mt-1.5">
      <div
        className="skill-bar-fill"
        style={{ width: inView ? `${width}%` : "0%" }}
      />
    </div>
  );
}

function SkillCard({ skill, inView }: { skill: any; inView: boolean }) {
  return (
    <div className="card p-3.5 card-hover group border border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-[var(--bg-card)]">
      <div className="flex items-center gap-2.5 mb-2">
        {skill.icon_url ? (
          <img src={skill.icon_url} alt={skill.name} className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            {skill.name[0]}
          </div>
        )}
        <span className="text-slate-900 dark:text-slate-100 text-sm font-semibold">{skill.name}</span>
        <span className="ml-auto text-xs text-slate-600 dark:text-slate-400 capitalize font-mono font-medium">{skill.level}</span>
      </div>
      <SkillBar level={skill.level} inView={inView} />
    </div>
  );
}

export default function SkillsSection() {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    publicApi.getSkills()
      .then((r) => setCategories(r.data.data || []))
      .catch(() => {});
  }, []);

  const filtered = activeCategory === "all"
    ? categories
    : categories.filter((c) => c.category_id === activeCategory);

  return (
    <section id="skills" className="py-24 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm mb-2 font-medium">// what I know</p>
          <h2 className="section-title">Skills & Technologies</h2>
          <div className="w-12 h-1 bg-emerald-500 rounded-full mb-4" />
          <p className="section-subtitle">Technologies I work with daily, from frontend to infrastructure.</p>
        </div>

        {/* Category filter */}
        <div className={`flex flex-wrap gap-2 mb-10 transition-all duration-700 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm",
              activeCategory === "all"
                ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40"
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              onClick={() => setActiveCategory(c.category_id)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-sm",
                activeCategory === c.category_id
                  ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40"
              )}
            >
              {c.category_name}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        {categories.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-20 rounded-xl bg-slate-100 dark:bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((category, ci) => (
              <div key={category.category_id}
                className={`transition-all duration-700`} style={{ transitionDelay: `${ci * 80}ms` }}>
                <h3 className="text-slate-900 dark:text-white font-bold text-sm mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </span>
                  {category.category_name}
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">({category.skills?.length || 0})</span>
                </h3>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {category.skills?.map((skill, si) => (
                    <div key={skill.id} className={`transition-all duration-500`} style={{ transitionDelay: `${ci * 80 + si * 40}ms` }}>
                      <SkillCard skill={skill} inView={inView} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/skills"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap group"
          >
            <span>View All Skills & Technical Proficiencies</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
