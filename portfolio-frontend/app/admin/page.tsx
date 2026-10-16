"use client";
import { useEffect, useState } from "react";
import {
  BarChart2, Mail, FolderKanban, FileText,
  Eye, MousePointer, Download, Send, TrendingUp, Clock
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import type { AnalyticsDashboard } from "@/types";
import { cn } from "@/lib/utils";

function StatCard({ icon: Icon, label, value, sub, color = "brand" }: any) {
  const colorMap: Record<string, string> = {
    brand: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/25",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-500/25",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-500/25",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-500/25",
    red: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-500/25",
    teal: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-500/10 border-teal-500/25",
  };
  return (
    <div className="card p-5 hover:border-emerald-500/40 transition-all duration-200 border border-slate-200 dark:border-white/10 shadow-sm bg-white dark:bg-[var(--bg-card)]">
      <div className="flex items-start justify-between mb-3.5">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shadow-sm", colorMap[color])}>
          <Icon size={18} />
        </div>
        {sub && <span className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tracking-wide">{sub}</span>}
      </div>
      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-1">
        {value !== undefined && value !== null ? value : 0}
      </div>
      <div className="text-slate-700 dark:text-slate-400 text-xs font-semibold tracking-wide">{label}</div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getTimeline(14),
      adminApi.getTopPages(),
      adminApi.getTopProjects(),
    ]).then(([d, t, p, pr]) => {
      setData(d.data.data);
      setTimeline(t.data.data || []);
      setTopPages(p.data.data || []);
      setTopProjects(pr.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const ev = data?.events;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">Dashboard Overview</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Welcome back! Real-time metrics and visitor interaction across your portfolio.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatCard icon={Eye} label="Page Views (30d)" value={ev?.last_30_days ?? 0} sub="Last 30 days" color="brand" />
          <StatCard icon={BarChart2} label="Page Views (7d)" value={ev?.last_7_days ?? 0} sub="Last 7 days" color="blue" />
          <StatCard icon={MousePointer} label="Project Clicks" value={ev?.project_clicks ?? 0} color="purple" />
          <StatCard icon={FileText} label="Blog Views" value={ev?.blog_views ?? 0} color="teal" />
          <StatCard icon={Send} label="Contact Submissions" value={ev?.contact_submissions ?? 0} color="amber" />
          <StatCard icon={Download} label="Resume Downloads" value={ev?.resume_downloads ?? 0} color="brand" />
          <StatCard icon={Mail} label="Unread Messages" value={data?.unread_contacts ?? 0} color="red" />
          <StatCard icon={FolderKanban} label="Live Projects" value={data?.published_projects ?? 0} color="brand" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-3">
            <div className="card p-6 h-full">
              <h2 className="text-slate-900 dark:text-white font-semibold text-base mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-500 dark:text-emerald-400" /> Recent Activity (14 days)
              </h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 dark:bg-white/[0.02] animate-pulse" />)}
                </div>
              ) : timeline.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
                  <Clock size={28} className="text-slate-400 dark:text-slate-600 mb-2" />
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">No recorded activity yet</p>
                  <p className="text-xs text-slate-500 dark:text-slate-600 max-w-xs">New visitor interactions and page views will appear here automatically.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {Object.entries(
                    timeline.reduce((acc: any, e: any) => {
                      const d = e.date;
                      if (!acc[d]) acc[d] = {};
                      acc[d][e.event_type] = (acc[d][e.event_type] || 0) + parseInt(e.count);
                      return acc;
                    }, {})
                  ).reverse().map(([date, events]: any) => (
                    <div key={date} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04]">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-mono w-24 flex-shrink-0">{date}</span>
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {Object.entries(events).map(([type, count]: any) => (
                          <span key={type} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] text-slate-700 dark:text-slate-300">
                            {type.replace(/_/g, " ")}: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Top Pages */}
            <div className="card p-6">
              <h2 className="text-slate-900 dark:text-white font-semibold text-base mb-4 flex items-center gap-2">
                <Eye size={16} className="text-emerald-500 dark:text-emerald-400" /> Top Viewed Pages
              </h2>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-8 rounded bg-slate-100 dark:bg-white/[0.02] animate-pulse" />)}</div>
              ) : topPages.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">No page view data recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {topPages.slice(0, 6).map((p: any, idx: number) => (
                    <div key={p.path} className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                        <span className="text-xs text-slate-400 dark:text-slate-600 font-mono w-4">{idx + 1}.</span>
                        <span className="text-slate-700 dark:text-slate-300 text-xs font-mono truncate">{p.path}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-mono">
                        {p.views}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Projects */}
            <div className="card p-6">
              <h2 className="text-slate-900 dark:text-white font-semibold text-base mb-4 flex items-center gap-2">
                <MousePointer size={16} className="text-emerald-500 dark:text-emerald-400" /> Top Project Clicks
              </h2>
              {loading ? (
                <div className="space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-8 rounded bg-slate-100 dark:bg-white/[0.02] animate-pulse" />)}</div>
              ) : topProjects.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">No project clicks recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProjects.slice(0, 5).map((p: any) => (
                    <div key={p.project_id} className="flex items-center justify-between py-2 border-b border-slate-200/70 dark:border-white/[0.04] last:border-0">
                      <span className="text-slate-700 dark:text-slate-300 text-xs truncate max-w-[70%]">{p.title}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-mono">{p.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { href: "/admin/projects", icon: FolderKanban, label: "Manage Projects" },
            { href: "/admin/blog", icon: FileText, label: "Manage Blog Posts" },
            { href: "/admin/contacts", icon: Mail, label: "View Inquiries" },
            { href: "/admin/settings", icon: Clock, label: "Site Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <a
              key={href}
              href={href}
              className="card p-5 text-center card-hover cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-2.5 group-hover:scale-105 transition-transform">
                <Icon size={18} />
              </div>
              <span className="text-slate-800 dark:text-slate-200 text-xs font-medium tracking-wide">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
