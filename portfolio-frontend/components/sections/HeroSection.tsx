"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowDown, Download, GitBranch, Users, MessageCircle, Globe, Mail, ChevronRight } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { SiteSettings, SocialLink } from "@/types";

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  github: <GitBranch size={18} />, linkedin: <Users size={18} />, twitter: <MessageCircle size={18} />,
  website: <Globe size={18} />, instagram: <Globe size={18} />, youtube: <Globe size={18} />, other: <Globe size={18} />,
};

function Typewriter({ words }: { words: string[] }) {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!words.length) return;
    const word = words[wordIdx % words.length];
    const speed = deleting ? 40 : 80;

    timeoutRef.current = setTimeout(() => {
      if (!deleting) {
        setDisplay(word.slice(0, charIdx + 1));
        if (charIdx + 1 === word.length) {
          setTimeout(() => setDeleting(true), 1800);
        } else {
          setCharIdx((c) => c + 1);
        }
      } else {
        setDisplay(word.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) {
          setDeleting(false);
          setWordIdx((w) => w + 1);
          setCharIdx(0);
        } else {
          setCharIdx((c) => c - 1);
        }
      }
    }, speed);

    return () => clearTimeout(timeoutRef.current);
  }, [words, wordIdx, charIdx, deleting]);

  return (
    <span className="text-emerald-600 dark:text-emerald-400">
      {display}
      <span className="typewriter-cursor" />
    </span>
  );
}

export default function HeroSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    Promise.all([publicApi.getSettings(), publicApi.getSocialLinks()]).then(([s, sl]) => {
      setSettings(s.data.data);
      setSocials(sl.data.data || []);
    }).catch(() => {});
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const taglines = settings?.hero_taglines || ["Full Stack Developer", "React Specialist", "Node.js Expert"];

  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center overflow-hidden px-6 pt-24 pb-12">
      {/* Background Subtle Ambience */}
      <div className="absolute inset-0 grid-overlay opacity-50" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto text-center flex flex-col items-center">
        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-medium tracking-wide mb-6 shadow-sm transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "0ms" }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Available for work & collaboration</span>
        </div>

        {/* Name */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-3 tracking-tight leading-[1.1] transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "100ms" }}
        >
          Hi, I&apos;m{" "}
          <span className="text-emerald-600 dark:text-emerald-400">
            {settings?.owner_name?.split(" ")[0] || "Irfan"}
          </span>
        </h1>

        {/* Typewriter */}
        <div
          className={`text-xl sm:text-2xl md:text-3xl font-semibold text-slate-700 dark:text-slate-300 mb-4 h-9 flex items-center justify-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "200ms" }}
        >
          <Typewriter words={taglines} />
        </div>

        {/* Bio */}
        <p
          className={`text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed font-normal transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "300ms" }}
        >
          {settings?.hero_bio_short || "I build fast, scalable, and beautiful web applications that people love to use."}
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-wrap items-center justify-center gap-3.5 mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "400ms" }}
        >
          <Link
            href="/#projects"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-sm tracking-wide shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap group"
          >
            <span>View My Work</span>
            <ChevronRight size={15} className="shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {settings?.owner_resume_url ? (
            <a
              href={settings.owner_resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap group"
              onClick={() => publicApi.trackEvent("resume_download", "/resume")}
            >
              <Download size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform" />
              <span>Download Resume</span>
            </a>
          ) : (
            <Link
              href="/#contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-300 dark:border-white/10 hover:border-emerald-500/50 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-sm shadow-sm hover:shadow transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap group"
            >
              <Mail size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform" />
              <span>Get In Touch</span>
            </Link>
          )}
        </div>

        {/* Social links */}
        {socials.length > 0 && (
          <div
            className={`flex items-center justify-center gap-2.5 mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "500ms" }}
          >
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 flex items-center justify-center text-slate-700 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow"
                aria-label={s.label || s.platform}
                onClick={() => publicApi.trackEvent("social_click", s.url)}
              >
                {PLATFORM_ICON[s.platform]}
              </a>
            ))}
          </div>
        )}

        {/* Scroll indicator */}
        <Link
          href="/#about"
          className="inline-flex flex-col items-center gap-1 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer group"
        >
          <span className="text-[10px] font-mono tracking-widest uppercase">Scroll</span>
          <ArrowDown size={14} className="animate-bounce" />
        </Link>
      </div>
    </section>
  );
}
