"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#skills", label: "Skills" },
  { href: "/#experience", label: "Experience" },
  { href: "/blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-dark-900/90 backdrop-blur-md border-b border-white/[0.06] py-3"
          : "py-5"
      )}
    >
      <nav className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center group-hover:bg-brand-500/30 transition-colors">
            <Terminal size={15} className="text-brand-400" />
          </span>
          <span className="font-bold text-white font-mono text-sm">
            irfan<span className="text-brand-400">.dev</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-1">
          {LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "nav-link px-3 py-1.5 rounded-md hover:bg-white/5",
                  pathname === href && "text-brand-400"
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        {/* CTA + hamburger */}
        <div className="flex items-center gap-3">
          <Link href="/admin/login" className="hidden md:inline-flex btn-outline text-xs px-4 py-2">
            Admin
          </Link>
          <button
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-dark-800/95 backdrop-blur-md border-t border-white/[0.06] px-6 py-4 flex flex-col gap-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="py-3 px-3 text-slate-300 hover:text-brand-400 font-medium text-sm border-b border-white/[0.05] last:border-0 transition-colors"
            >
              {label}
            </Link>
          ))}
          <Link href="/admin/login" className="mt-3 btn-outline text-center text-xs py-2">
            Admin Panel
          </Link>
        </div>
      )}
    </header>
  );
}
