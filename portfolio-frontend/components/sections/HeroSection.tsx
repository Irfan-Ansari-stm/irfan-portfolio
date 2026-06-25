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
    <span className="text-brand-400">
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
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 grid-overlay opacity-60" />
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Floating code decorations */}
      <div className="absolute top-32 right-12 hidden xl:block opacity-20 font-mono text-xs text-brand-400 rotate-6 select-none">
        {`const dev = {\n  name: "Irfan",\n  skills: ["React","Node"],\n  available: true\n}`}
      </div>
      <div className="absolute bottom-40 left-12 hidden xl:block opacity-20 font-mono text-xs text-brand-400 -rotate-3 select-none">
        {`git commit -m "building dreams"`}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-brand-500/30 text-brand-400 text-xs font-medium mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "0ms" }}
        >
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Available for work
        </div>

        {/* Name */}
        <h1
          className={`text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4 leading-tight transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "100ms" }}
        >
          Hi, I&apos;m{" "}
          <span className="gradient-text">{settings?.owner_name?.split(" ")[0] || "Irfan"}</span>
        </h1>

        {/* Typewriter */}
        <div
          className={`text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 h-12 flex items-center justify-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "200ms" }}
        >
          <Typewriter words={taglines} />
        </div>

        {/* Bio */}
        <p
          className={`text-slate-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "300ms" }}
        >
          {settings?.hero_bio_short || "I build fast, scalable, and beautiful web applications that people love to use."}
        </p>

        {/* CTAs */}
        <div
          className={`flex flex-wrap items-center justify-center gap-4 mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          style={{ transitionDelay: "400ms" }}
        >
          <Link href="/#projects" className="btn-primary shadow-glow-sm group">
            View My Work
            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          {settings?.owner_resume_url ? (
            <a href={settings.owner_resume_url} target="_blank" rel="noopener noreferrer"
              className="btn-outline"
              onClick={() => publicApi.trackEvent("resume_download", "/resume")}>
              <Download size={16} />
              Download Resume
            </a>
          ) : (
            <Link href="/#contact" className="btn-outline">
              <Mail size={16} />
              Get In Touch
            </Link>
          )}
        </div>

        {/* Social links */}
        {socials.length > 0 && (
          <div
            className={`flex items-center justify-center gap-3 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "500ms" }}
          >
            {socials.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg glass glass-hover flex items-center justify-center text-slate-400 hover:text-brand-400"
                aria-label={s.label || s.platform}
                onClick={() => publicApi.trackEvent("social_click", s.url)}
              >
                {PLATFORM_ICON[s.platform]}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
        <span className="text-xs font-mono">scroll</span>
        <ArrowDown size={16} />
      </div>
    </section>
  );
}
