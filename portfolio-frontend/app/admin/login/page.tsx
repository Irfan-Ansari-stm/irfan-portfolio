"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { saveTokens, saveAdminUser, isAuthenticated } from "@/lib/auth";
import ThemeToggle from "@/components/theme/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) router.replace("/admin");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const res = await adminApi.login(form.email, form.password);
      const { accessToken, refreshToken, admin } = res.data.data;
      saveTokens(accessToken, refreshToken);
      saveAdminUser(admin);
      toast.success(`Welcome back, ${admin.name}!`);
      router.push("/admin");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid credentials");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative bg-[var(--bg-primary)] transition-colors">
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/10">
            <Terminal size={24} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Admin Login</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">irfan<span className="text-emerald-500 dark:text-emerald-400">.dev</span> management dashboard</p>
        </div>

        <div className="card p-7 sm:p-8 shadow-2xl border-slate-200 dark:border-white/10">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="admin@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button type="button" onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-3 py-2.5 shadow-sm disabled:opacity-60">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-neutral-950/30 border-t-neutral-950 rounded-full animate-spin" />Signing in...</>
              ) : (
                <><Lock size={15} />Sign In to Admin</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-xs mt-6">
          First time setup? Use <code className="text-emerald-600 dark:text-emerald-400 font-mono">POST /api/auth/setup</code> to configure your master account.
        </p>
      </div>
    </div>
  );
}
