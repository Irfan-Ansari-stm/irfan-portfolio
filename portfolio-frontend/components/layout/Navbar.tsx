"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { publicApi } from "@/lib/api";
import type { SiteSettings } from "@/types";
import ThemeToggle from "@/components/theme/ThemeToggle";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#experience", label: "Experience" },
  { href: "/#blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    publicApi.getSettings()
      .then((r) => {
        if (r.data.data) setSettings(r.data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header className="fixed top-0 inset-x-0 z-50 pointer-events-none pt-3 sm:pt-4 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-6">
        <div
          className={cn(
            "pointer-events-auto w-full rounded-2xl border transition-all duration-300",
            scrolled
              ? "bg-white/90 dark:bg-neutral-950/85 backdrop-blur-2xl border-slate-200/90 dark:border-white/[0.12] shadow-lg shadow-slate-900/5 dark:shadow-black/60 px-4 sm:px-6 py-2.5 sm:py-3"
              : "bg-white/85 dark:bg-neutral-950/65 backdrop-blur-xl border-slate-200/80 dark:border-white/[0.08] shadow-md shadow-slate-900/5 dark:shadow-black/25 px-4 sm:px-6 py-3 sm:py-3.5"
          )}
        >
          <nav className="flex items-center justify-between">
          {/* Logo (Dynamic from Dashboard Settings) */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {settings?.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.logo_text || "Logo"}
                className="w-8 h-8 rounded-full object-cover border border-emerald-500/40 shadow-sm group-hover:scale-105 transition-transform bg-slate-100 dark:bg-neutral-900"
              />
            ) : (
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center group-hover:bg-emerald-500/25 transition-all">
                <Terminal size={15} className="text-emerald-600 dark:text-emerald-400" />
              </span>
            )}
            <span className="font-bold text-slate-900 dark:text-white font-mono text-sm tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {settings?.logo_text ? (
                settings.logo_text
              ) : (
                <>irfan<span className="text-emerald-500 dark:text-emerald-400">.dev</span></>
              )}
            </span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-1 bg-slate-100/90 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.08] px-3 py-1.5 rounded-full backdrop-blur-md shadow-inner">
            {LINKS.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200",
                    pathname === href
                      ? "text-emerald-700 dark:text-emerald-400 bg-white dark:bg-white/[0.08] shadow-sm"
                      : "text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:hover:bg-white/[0.05]"
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA + Theme Toggle + Mobile menu button */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle className="w-9 h-9" />
            <Link
              href="/#contact"
              className="hidden md:inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs tracking-wide transition-all duration-200 shadow-[0_0_15px_rgba(34,197,94,0.25)] hover:shadow-[0_0_22px_rgba(34,197,94,0.45)] hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              Get In Touch
            </Link>
            <button
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* Mobile menu (unfolds inside the cropped floating container) */}
        {open && (
          <div className="md:hidden pt-3 mt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-1">
            {LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="py-2.5 px-3 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium text-sm rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/#contact"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold text-xs transition-all shadow-md"
            >
              Get In Touch
            </Link>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
