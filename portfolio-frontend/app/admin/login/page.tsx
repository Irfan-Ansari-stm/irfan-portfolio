"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Terminal, Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { saveTokens, saveAdminUser, isAuthenticated } from "@/lib/auth";

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
    <div className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 grid-overlay opacity-40" />
      <div className="absolute inset-0 bg-hero-gradient" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center mb-4 animate-glow-pulse">
            <Terminal size={24} className="text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">irfan<span className="text-brand-400">.dev</span> dashboard</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="input"
                placeholder="irfan@example.com"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center mt-2 shadow-glow-sm disabled:opacity-60">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />Signing in...</>
              ) : (
                <><Lock size={15} />Sign In</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          First time? Use <code className="text-brand-500">POST /api/auth/setup</code> to create your account.
        </p>
      </div>
    </div>
  );
}
