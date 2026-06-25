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
    brand: "text-brand-400 bg-brand-500/10 border-brand-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center", colorMap[color])}>
          <Icon size={18} />
        </div>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value ?? "—"}</div>
      <div className="text-slate-500 text-xs font-medium">{label}</div>
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
          <p className="text-slate-500 text-sm">Welcome back! Here&apos;s what&apos;s happening with your portfolio.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Eye} label="Page Views (30d)" value={ev?.last_30_days ?? "—"} sub="Last 30 days" color="brand" />
          <StatCard icon={BarChart2} label="Page Views (7d)" value={ev?.last_7_days ?? "—"} sub="Last 7 days" color="blue" />
          <StatCard icon={MousePointer} label="Project Clicks" value={ev?.project_clicks ?? "—"} color="purple" />
          <StatCard icon={FileText} label="Blog Views" value={ev?.blog_views ?? "—"} color="teal" />
          <StatCard icon={Send} label="Contact Submissions" value={ev?.contact_submissions ?? "—"} color="amber" />
          <StatCard icon={Download} label="Resume Downloads" value={ev?.resume_downloads ?? "—"} color="brand" />
          <StatCard icon={Mail} label="Unread Messages" value={data?.unread_contacts ?? "—"} color="red" />
          <StatCard icon={FolderKanban} label="Live Projects" value={data?.published_projects ?? "—"} color="brand" />
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Activity Feed */}
          <div className="lg:col-span-3">
            <div className="card p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-400" /> Recent Activity (14 days)
              </h2>
              {loading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map(i => <div key={i} className="h-8 rounded bg-white/[0.02] animate-pulse" />)}
                </div>
              ) : timeline.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No events yet. Events appear when visitors interact with your site.</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {Object.entries(
                    timeline.reduce((acc: any, e: any) => {
                      const d = e.date;
                      if (!acc[d]) acc[d] = {};
                      acc[d][e.event_type] = (acc[d][e.event_type] || 0) + parseInt(e.count);
                      return acc;
                    }, {})
                  ).reverse().map(([date, events]: any) => (
                    <div key={date} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-500 text-xs font-mono w-24 flex-shrink-0">{date}</span>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(events).map(([type, count]: any) => (
                          <span key={type} className="text-xs px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400">
                            {type.replace(/_/g, " ")}: <span className="text-white">{count}</span>
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
            <div className="card p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Eye size={16} className="text-brand-400" /> Top Pages
              </h2>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded bg-white/[0.02] animate-pulse" />)}</div>
              ) : topPages.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No page view data yet.</p>
              ) : (
                <div className="space-y-2">
                  {topPages.slice(0, 6).map((p: any) => (
                    <div key={p.path} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-400 text-xs font-mono truncate max-w-[65%]">{p.path}</span>
                      <span className="text-white text-xs font-semibold">{p.views}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Projects */}
            <div className="card p-5">
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MousePointer size={16} className="text-brand-400" /> Top Projects
              </h2>
              {loading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-8 rounded bg-white/[0.02] animate-pulse" />)}</div>
              ) : topProjects.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-4">No project clicks yet.</p>
              ) : (
                <div className="space-y-2">
                  {topProjects.slice(0, 5).map((p: any) => (
                    <div key={p.project_id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-slate-400 text-xs truncate max-w-[70%]">{p.title}</span>
                      <span className="text-brand-400 text-xs font-semibold">{p.clicks} clicks</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { href: "/admin/projects", icon: FolderKanban, label: "Manage Projects" },
            { href: "/admin/blog", icon: FileText, label: "Manage Blog" },
            { href: "/admin/contacts", icon: Mail, label: "View Contacts" },
            { href: "/admin/settings", icon: Clock, label: "Site Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <a key={href} href={href}
              className="card p-4 text-center card-hover cursor-pointer group">
              <Icon size={20} className="text-brand-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-slate-300 text-xs font-medium">{label}</span>
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
