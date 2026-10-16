"use client";
import { useEffect, useState } from "react";
import { BarChart2, Eye, MousePointer, Download, Send, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import type { AnalyticsDashboard } from "@/types";

function MetricCard({ label, value, icon: Icon, color = "emerald" }: any) {
  const colors: Record<string, string> = {
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
    teal: "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20",
    red: "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20",
  };
  return (
    <div className="card p-5 flex items-center gap-4 hover:border-emerald-500/30 transition-all">
      <div className={`w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[color] || colors.emerald}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
          {value !== undefined && value !== null ? value : 0}
        </div>
        <div className="text-slate-600 dark:text-slate-400 text-xs font-medium truncate">{label}</div>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [topPages, setTopPages] = useState<any[]>([]);
  const [topProjects, setTopProjects] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getDashboard(),
      adminApi.getTimeline(days),
      adminApi.getTopPages(),
      adminApi.getTopProjects(),
    ]).then(([d, t, p, pr]) => {
      setData(d.data.data);
      setTimeline(t.data.data || []);
      setTopPages(p.data.data || []);
      setTopProjects(pr.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [days]);

  const ev = data?.events;

  // Aggregate timeline by event type for simple bar visualization
  const timelineByType = timeline.reduce((acc: any, e: any) => {
    if (!acc[e.event_type]) acc[e.event_type] = 0;
    acc[e.event_type] += parseInt(e.count);
    return acc;
  }, {});

  const maxVal = Math.max(...Object.values(timelineByType).map(Number), 1);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Traffic & Performance Analytics</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Real-time engagement telemetry, page views, and project interaction logs.</p>
          </div>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="input text-sm sm:w-44">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MetricCard icon={Eye} label={`Page Views (${days}d)`} value={ev?.last_30_days} color="emerald" />
          <MetricCard icon={TrendingUp} label="Views Today (24h)" value={ev?.last_24h} color="blue" />
          <MetricCard icon={MousePointer} label="Project Clicks" value={ev?.project_clicks} color="purple" />
          <MetricCard icon={BarChart2} label="Blog Views" value={ev?.blog_views} color="teal" />
          <MetricCard icon={Send} label="Contact Forms" value={ev?.contact_submissions} color="amber" />
          <MetricCard icon={Download} label="Resume Downloads" value={ev?.resume_downloads} color="red" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Event Breakdown */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
              <h2 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
                <BarChart2 size={17} className="text-emerald-500 dark:text-emerald-400" />
                <span>Event Breakdown</span>
              </h2>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">{days} days window</span>
            </div>
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-9 bg-slate-100 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl animate-pulse" />)}</div>
            ) : Object.keys(timelineByType).length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">No telemetry events logged yet.</p>
            ) : (
              <div className="space-y-3.5">
                {Object.entries(timelineByType)
                  .sort(([,a], [,b]) => Number(b) - Number(a))
                  .map(([type, count]: any) => (
                    <div key={type} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-700 dark:text-slate-300 font-medium capitalize">{type.replace(/_/g, " ")}</span>
                        <span className="text-slate-900 dark:text-white font-mono font-semibold">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-700"
                          style={{ width: `${(count / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
              <h2 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
                <Eye size={17} className="text-emerald-500 dark:text-emerald-400" />
                <span>Top Viewed Pages</span>
              </h2>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">Top paths (30d)</span>
            </div>
            {loading ? (
              <div className="space-y-2.5">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl animate-pulse" />)}</div>
            ) : topPages.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-10 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">No page view data available.</p>
            ) : (
              <div className="space-y-2">
                {topPages.map((p: any, i: number) => (
                  <div key={p.path} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] hover:bg-slate-100/70 dark:hover:bg-white/[0.04] transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-300 text-xs font-mono flex-1 truncate">{p.path}</span>
                    <div className="text-right flex items-center gap-2">
                      <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{p.views} views</span>
                      <span className="text-slate-500 text-xs font-mono">{p.unique_visitors} uniq</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Projects */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/[0.06]">
            <h2 className="text-slate-900 dark:text-white font-bold text-base flex items-center gap-2">
              <MousePointer size={17} className="text-emerald-500 dark:text-emerald-400" />
              <span>Top Clicked Projects</span>
            </h2>
            <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">Last 30 days</span>
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-100 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.04] rounded-xl animate-pulse" />)}</div>
          ) : topProjects.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-10 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">No project click events recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                    {["Rank", "Project Title", "Project Slug", "Total Clicks"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.04]">
                  {topProjects.map((p: any, i: number) => (
                    <tr key={p.project_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-mono font-medium">#{i + 1}</td>
                      <td className="px-5 py-3.5 text-slate-900 dark:text-white text-sm font-semibold">{p.title}</td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-mono">{p.slug}</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
                          {p.clicks} clicks
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
