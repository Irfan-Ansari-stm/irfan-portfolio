"use client";
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { publicApi } from "@/lib/api";
import type { SkillCategory } from "@/types";
import { SKILL_LEVEL_MAP } from "@/lib/utils";

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
    <div className="card p-3 card-hover group">
      <div className="flex items-center gap-2.5 mb-2">
        {skill.icon_url ? (
          <img src={skill.icon_url} alt={skill.name} className="w-6 h-6 object-contain" />
        ) : (
          <div className="w-6 h-6 rounded bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">
            {skill.name[0]}
          </div>
        )}
        <span className="text-slate-200 text-sm font-medium">{skill.name}</span>
        <span className="ml-auto text-xs text-slate-500 capitalize font-mono">{skill.level}</span>
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
          <p className="text-brand-400 font-mono text-sm mb-2">// what I know</p>
          <h2 className="section-title">Skills & Technologies</h2>
          <div className="w-12 h-1 bg-brand-500 rounded-full mb-4" />
          <p className="section-subtitle">Technologies I work with daily, from frontend to infrastructure.</p>
        </div>

        {/* Category filter */}
        <div className={`flex flex-wrap gap-2 mb-10 transition-all duration-700 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === "all" ? "bg-brand-500 text-dark-900" : "glass text-slate-400 hover:text-white"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.category_id}
              onClick={() => setActiveCategory(c.category_id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeCategory === c.category_id ? "bg-brand-500 text-dark-900" : "glass text-slate-400 hover:text-white"}`}
            >
              {c.category_name}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        {categories.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map((category, ci) => (
              <div key={category.category_id}
                className={`transition-all duration-700`} style={{ transitionDelay: `${ci * 80}ms` }}>
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-brand-500/20 flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-brand-500" />
                  </span>
                  {category.category_name}
                  <span className="text-slate-600 text-xs font-mono">({category.skills?.length || 0})</span>
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
      </div>
    </section>
  );
}
