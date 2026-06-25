"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FolderKanban, FileText, Mail, BarChart2,
  Settings, LogOut, Terminal, Menu, X, ChevronRight, User, Wrench
} from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { clearTokens, getAdminUser, isAuthenticated } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/projects", icon: FolderKanban, label: "Projects" },
  { href: "/admin/blog", icon: FileText, label: "Blog Posts" },
  { href: "/admin/contacts", icon: Mail, label: "Contacts" },
  { href: "/admin/analytics", icon: BarChart2, label: "Analytics" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/skills", icon: Wrench, label: "Skills" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 border border-brand-500/40 flex items-center justify-center">
            <Terminal size={14} className="text-brand-400" />
          </div>
          <div>
            <div className="text-white font-bold text-sm font-mono">irfan<span className="text-brand-400">.dev</span></div>
            <div className="text-slate-600 text-xs">Admin Panel</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link key={href} href={href} onClick={() => setSidebarOpen(false)}
            className={cn("admin-sidebar-link", isActive(href) && "admin-sidebar-link-active")}>
            <Icon size={16} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={14} className="ml-auto" />}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 px-3 py-3 rounded-lg mb-2 bg-white/[0.02]">
          <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
            {user?.avatar_url
              ? <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" alt="" />
              : <User size={15} />}
          </div>
          <div className="overflow-hidden">
            <div className="text-white text-xs font-medium truncate">{user?.name}</div>
            <div className="text-slate-500 text-xs truncate">{user?.email}</div>
          </div>
        </div>
        <button onClick={logout}
          className="admin-sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/5">
          <LogOut size={15} />Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col bg-dark-800 border-r border-white/[0.06] fixed h-screen z-30">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-56 h-full bg-dark-800 border-r border-white/[0.06]">
            <button onClick={() => setSidebarOpen(false)}
              className="absolute top-3 right-3 text-slate-400 hover:text-white p-1.5 rounded">
              <X size={18} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-dark-800 border-b border-white/[0.06] sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <span className="text-white font-bold text-sm font-mono">irfan<span className="text-brand-400">.dev</span></span>
          <span className="ml-auto text-slate-500 text-xs">Admin</span>
        </header>
        <main className="flex-1 p-6 bg-dark-900">{children}</main>
      </div>
    </div>
  );
}
