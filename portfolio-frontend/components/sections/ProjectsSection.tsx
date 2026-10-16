"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";
import { GitBranch, ExternalLink, X, ChevronLeft, ChevronRight, Star, ArrowRight } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { Project, Tag } from "@/types";
import { cn, truncate } from "@/lib/utils";

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", fn); document.body.style.overflow = ""; };
  }, [onClose]);

  const shots = project.screenshots || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog max-w-3xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-slate-100 dark:bg-dark-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <X size={16} />
        </button>

        {/* Image carousel */}
        {(project.thumbnail_url || shots.length > 0) && (
          <div className="relative h-56 bg-slate-100 dark:bg-dark-700 rounded-t-2xl overflow-hidden">
            <img
              src={shots[imgIdx]?.url || project.thumbnail_url || "/placeholder.png"}
              alt={shots[imgIdx]?.alt_text || project.title}
              className="w-full h-full object-cover"
            />
            {shots.length > 1 && (
              <>
                <button onClick={() => setImgIdx((i) => (i - 1 + shots.length) % shots.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setImgIdx((i) => (i + 1) % shots.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors">
                  <ChevronRight size={16} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {shots.map((_, i) => (
                    <button key={i} onClick={() => setImgIdx(i)}
                      className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === imgIdx ? "bg-emerald-500" : "bg-white/40")} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{project.title}</h3>
            {project.is_featured && (
              <span className="flex-shrink-0 flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Star size={11} fill="currentColor" /> Featured
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.tags?.map((t) => (
              <span key={t.id} className="tag-badge" style={{ background: `${t.color}18`, color: t.color, border: `1px solid ${t.color}30` }}>
                {t.label}
              </span>
            ))}
          </div>

          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed mb-4">{project.short_desc}</p>
          {project.long_desc && (
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 whitespace-pre-line">{project.long_desc}</p>
          )}

          <div className="flex gap-3">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noopener noreferrer"
                className="btn-outline text-xs px-4 py-2">
                <GitBranch size={14} /> Source Code
              </a>
            )}
            {project.demo_url && (
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer"
                className="btn-primary text-xs px-4 py-2">
                <ExternalLink size={14} /> Live Demo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn("card card-hover cursor-pointer overflow-hidden group", project.is_featured && "ring-1 ring-amber-500/30")}
    >
      {/* Thumbnail */}
      <div className="relative h-44 bg-slate-100 dark:bg-slate-900/60 overflow-hidden border-b border-slate-200 dark:border-white/5">
        {project.thumbnail_url
          ? <img src={project.thumbnail_url} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200/80 dark:from-slate-900 dark:to-slate-950 p-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 shadow-sm">
                <GitBranch size={18} />
              </div>
              <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                {project.title}
              </span>
            </div>
          )
        }
        {project.is_featured && (
          <span className="absolute top-2.5 left-2.5 flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-neutral-950 font-bold shadow-sm">
            <Star size={10} fill="currentColor" /> Featured
          </span>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
          <p className="text-xs text-white font-medium">Click to view details</p>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-slate-900 dark:text-white font-bold text-base mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{project.title}</h3>
        <p className="text-slate-700 dark:text-slate-300 text-sm mb-4 leading-relaxed">{truncate(project.short_desc, 100)}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {project.tags?.slice(0, 4).map((t) => (
            <span key={t.id} className="tag-badge" style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}30` }}>
              {t.label}
            </span>
          ))}
          {(project.tags?.length || 0) > 4 && <span className="tag-badge text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10">+{project.tags.length - 4}</span>}
        </div>

        {/* Links */}
        <div className="flex gap-3 text-slate-500 dark:text-slate-400">
          {project.github_url && (
            <a href={project.github_url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-slate-900 dark:hover:text-white transition-colors" title="View Source"><GitBranch size={16} /></a>
          )}
          {project.demo_url && (
            <a href={project.demo_url} target="_blank" rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="Live Demo"><ExternalLink size={16} /></a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsSection() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeTag, setActiveTag] = useState<string>("all");
  const [selected, setSelected] = useState<Project | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const loadProjects = useCallback(async (tag: string, pg: number) => {
    setLoading(true);
    try {
      const params: any = { page: pg, limit: 9 };
      if (tag !== "all") params.tag = tag;
      const res = await publicApi.getProjects(params);
      const data = res.data;
      if (pg === 1) setProjects(data.data);
      else setProjects((p) => [...p, ...data.data]);
      setHasMore(data.pagination?.hasNext || false);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    publicApi.getTags().then((r) => setTags(r.data.data || [])).catch(() => {});
    loadProjects("all", 1);
  }, [loadProjects]);

  const handleTagChange = (tag: string) => {
    setActiveTag(tag);
    setPage(1);
    loadProjects(tag, 1);
    publicApi.trackEvent("page_view", `/#projects?tag=${tag}`);
  };

  return (
    <section id="projects" className="py-24 relative" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className={`mb-10 transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <p className="text-emerald-600 dark:text-emerald-400 font-mono text-sm mb-2 font-medium">// my work</p>
          <h2 className="section-title">Projects</h2>
          <div className="w-12 h-1 bg-emerald-500 rounded-full mb-4" />
          <p className="section-subtitle">Things I&apos;ve built — from side projects to production apps.</p>
        </div>

        {/* Filter */}
        <div className={`flex flex-wrap gap-2 mb-10 transition-all duration-700 delay-100 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {["all", ...tags.map((t) => t.name)].map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagChange(tag)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm",
                activeTag === tag
                  ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm"
                  : "bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-emerald-500/40"
              )}
            >
              {tag === "all" ? "All" : tags.find((t) => t.name === tag)?.label || tag}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3,4,5,6].map((i) => <div key={i} className="h-72 rounded-xl bg-slate-100 dark:bg-white/[0.02] animate-pulse" />)}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No projects found.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((p, i) => (
              <div key={p.id} className={`transition-all duration-500`} style={{ transitionDelay: `${(i % 9) * 60}ms` }}>
                <ProjectCard project={p} onClick={() => {
                  setSelected(p);
                  publicApi.trackEvent("project_click", `/projects/${p.slug}`, p.id);
                }} />
              </div>
            ))}
          </div>
        )}

        {/* Bottom controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          {hasMore && (
            <button onClick={() => { const np = page + 1; setPage(np); loadProjects(activeTag, np); }}
              className="btn-outline">
              Load More Projects
            </button>
          )}
          <Link
            href="/projects"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs tracking-wide shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 whitespace-nowrap group"
          >
            <span>Explore All Projects & Details</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {selected && <ProjectModal project={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
