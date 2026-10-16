"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, FileText, Mail, BarChart2,
  Settings, LogOut, Terminal, Menu, X, ChevronRight, User, Wrench, ExternalLink, Images
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi, publicApi } from "@/lib/api";
import { clearTokens, getAdminUser, isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types";
import ThemeToggle from "@/components/theme/ThemeToggle";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/projects", icon: FolderKanban, label: "Projects" },
  { href: "/admin/blog", icon: FileText, label: "Blog Posts" },
  { href: "/admin/media", icon: Images, label: "Media Library" },
  { href: "/admin/skills", icon: Wrench, label: "Skills" },
  { href: "/admin/contacts", icon: Mail, label: "Contacts" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicApi.getSettings().then((r) => setSettings(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { router.replace("/admin/login"); return; }
    const saved = getAdminUser();
    if (saved) { setUser(saved); setLoading(false); return; }
    adminApi.getMe()
      .then((r) => setUser(r.data.data))
      .catch(() => { clearTokens(); router.replace("/admin/login"); })
      .finally(() => setLoading(false));
  }, [router]);

  function logout() {
    adminApi.logout().catch(() => {});
    clearTokens();
    toast.success("Logged out");
    router.push("/admin/login");
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-950 transition-colors">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-slate-200 dark:border-white/[0.08]">
        <Link href="/" className="flex items-center gap-3 group">
          {settings?.logo_url ? (
            <img
              src={settings.logo_url}
              alt={settings.logo_text || "Logo"}
              className="w-9 h-9 rounded-full object-cover border border-emerald-500/30 flex-shrink-0 bg-slate-100 dark:bg-neutral-900 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/25 transition-all shadow-sm flex-shrink-0">
              <Terminal size={16} />
            </div>
          )}
          <div className="min-w-0">
            <div className="text-slate-900 dark:text-white font-bold text-sm font-mono tracking-tight truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {settings?.logo_text || <>irfan<span className="text-emerald-500 dark:text-emerald-400">.dev</span></>}
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px] font-medium tracking-wide flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin Console</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3.5 py-5 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/25 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]"
              )}
            >
              <Icon size={17} className={cn("shrink-0 transition-colors", active ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
              <span className="truncate">{label}</span>
              {active && <ChevronRight size={14} className="ml-auto text-emerald-600 dark:text-emerald-400 shrink-0" />}
            </Link>
          );
        })}
      </nav>

      {/* User & Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] mt-auto">
        <ThemeToggle showLabel className="w-full justify-between px-3.5 py-2 mb-2" />
        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-100/70 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] mb-2">
          <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              : <User size={16} />}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <div className="text-slate-900 dark:text-white text-xs font-semibold truncate">{user?.name || "Irfan Ansari"}</div>
            <div className="text-slate-500 text-[11px] font-mono truncate">{user?.email || "admin@example.com"}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={15} className="shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)] transition-colors">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-white/[0.08] fixed h-screen z-30 transition-colors">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-white dark:bg-neutral-950 border-r border-slate-200 dark:border-white/[0.08] shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              {settings?.logo_url && (
                <img
                  src={settings.logo_url}
                  alt={settings.logo_text || "Logo"}
                  className="w-6 h-6 rounded-full object-cover border border-emerald-500/30 bg-slate-100 dark:bg-neutral-900"
                />
              )}
              <span className="text-slate-900 dark:text-white font-bold text-sm font-mono truncate">
                {settings?.logo_text || <>irfan<span className="text-emerald-500 dark:text-emerald-400">.dev</span></>}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle className="w-8 h-8" />
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
              Admin
            </span>
          </div>
        </header>

        {/* Top bar (desktop enterprise header) */}
        <header className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.08] sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Console</span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="text-slate-900 dark:text-white font-semibold">
              {NAV.find((n) => n.href === pathname)?.label || "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 hover:bg-slate-200/70 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 transition-colors shadow-sm"
            >
              <ExternalLink size={13} />
              <span>Live Website</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 dark:border-white/10 mx-1" />
            <ThemeToggle className="w-8 h-8" />
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-white/10">
              <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                {user?.name?.[0] || "A"}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {user?.name || "Admin"}
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
