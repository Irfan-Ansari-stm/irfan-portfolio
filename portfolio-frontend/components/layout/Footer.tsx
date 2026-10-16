"use client";
import Link from "next/link";
import { GitBranch, Users, MessageCircle, Globe, Mail, Terminal, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { publicApi } from "@/lib/api";
import type { SocialLink, SiteSettings } from "@/types";
import ThemeToggle from "@/components/theme/ThemeToggle";

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  github: <GitBranch size={16} />,
  linkedin: <Users size={16} />,
  twitter: <MessageCircle size={16} />,
  website: <Globe size={16} />,
  instagram: <Globe size={16} />,
  youtube: <Globe size={16} />,
  other: <Globe size={16} />,
};

export default function Footer() {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    publicApi.getSocialLinks().then((r) => setSocials(r.data.data || [])).catch(() => {});
    publicApi.getSettings().then((r) => setSettings(r.data.data)).catch(() => {});
  }, []);

  return (
    <footer className="border-t border-black/[0.06] dark:border-white/[0.06] bg-slate-100/70 dark:bg-dark-800/50 mt-24 transition-colors">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <Terminal size={13} className="text-emerald-500 dark:text-emerald-400" />
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                irfan<span className="text-emerald-500 dark:text-emerald-400">.dev</span>
              </span>
            </Link>
            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xs">
              {settings?.hero_bio_short || "Full Stack Developer building scalable web applications."}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Quick Links</h4>
            <ul className="space-y-2">
              {[["/#about","About"],["/#projects","Projects"],["/#skills","Skills"],["/#experience","Experience"],["/#blog","Blog"],["/#contact","Contact"]].map(([href,label]) => (
                <li key={href}>
                  <Link href={href} className="text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social + Contact */}
          <div>
            <h4 className="text-slate-900 dark:text-white font-semibold text-sm mb-3">Connect</h4>
            <div className="flex flex-wrap gap-2 mb-4">
              {socials.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
                  aria-label={s.label || s.platform}
                >
                  {PLATFORM_ICON[s.platform]}
                </a>
              ))}
              {settings?.owner_email && (
                <a
                  href={`mailto:${settings.owner_email}`}
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
                  aria-label="Email"
                >
                  <Mail size={16} />
                </a>
              )}
            </div>
            {settings?.owner_location && (
              <p className="text-slate-500 text-xs">{settings.owner_location}</p>
            )}
          </div>
        </div>

        <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 dark:text-slate-400 text-xs" suppressHydrationWarning>
            © {new Date().getFullYear()} {settings?.owner_name || "Irfan Ansari"}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle showLabel className="text-xs py-1.5 px-3" />
            <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
              Built with <Heart size={11} className="text-emerald-500 fill-emerald-500" /> using Next.js & TypeScript
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
