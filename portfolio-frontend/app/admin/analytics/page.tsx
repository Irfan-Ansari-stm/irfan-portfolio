"use client";
import { useEffect, useState } from "react";
import { BarChart2, Eye, MousePointer, Mail, Download, Send, TrendingUp } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import type { AnalyticsDashboard } from "@/types";

function MetricCard({ label, value, icon: Icon, color = "brand" }: any) {
  const colors: Record<string, string> = {
    brand: "text-brand-400 bg-brand-500/10",
    blue: "text-blue-400 bg-blue-500/10",
    purple: "text-purple-400 bg-purple-500/10",
    amber: "text-amber-400 bg-amber-500/10",
    teal: "text-teal-400 bg-teal-500/10",
    red: "text-red-400 bg-red-500/10",
  };
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{value ?? "—"}</div>
        <div className="text-slate-500 text-xs">{label}</div>
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
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track how visitors interact with your portfolio.</p>
          </div>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="input text-sm max-w-[160px]">
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <MetricCard icon={Eye} label={`Page Views (${days}d)`} value={ev?.last_30_days} color="brand" />
          <MetricCard icon={TrendingUp} label="Views Today" value={ev?.last_24h} color="blue" />
          <MetricCard icon={MousePointer} label="Project Clicks" value={ev?.project_clicks} color="purple" />
          <MetricCard icon={BarChart2} label="Blog Views" value={ev?.blog_views} color="teal" />
          <MetricCard icon={Send} label="Contact Forms" value={ev?.contact_submissions} color="amber" />
          <MetricCard icon={Download} label="Resume Downloads" value={ev?.resume_downloads} color="red" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Event Breakdown */}
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <BarChart2 size={16} className="text-brand-400" /> Event Breakdown ({days}d)
            </h2>
            {loading ? (
              <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/[0.02] rounded animate-pulse" />)}</div>
            ) : Object.keys(timelineByType).length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No events yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(timelineByType)
                  .sort(([,a], [,b]) => Number(b) - Number(a))
                  .map(([type, count]: any) => (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 capitalize">{type.replace(/_/g, " ")}</span>
                        <span className="text-white font-semibold">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                          style={{ width: `${(count / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Top Pages */}
          <div className="card p-5">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Eye size={16} className="text-brand-400" /> Top Pages (30d)
            </h2>
            {loading ? (
              <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-8 bg-white/[0.02] rounded animate-pulse" />)}</div>
            ) : topPages.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">No page view data.</p>
            ) : (
              <div className="space-y-1">
                {topPages.map((p: any, i: number) => (
                  <div key={p.path} className="flex items-center gap-3 py-2.5 border-b border-white/[0.04] last:border-0">
                    <span className="text-slate-600 text-xs font-mono w-5 text-right">{i + 1}</span>
                    <span className="text-slate-400 text-xs font-mono flex-1 truncate">{p.path}</span>
                    <div className="text-right">
                      <div className="text-white text-xs font-semibold">{p.views}</div>
                      <div className="text-slate-600 text-xs">{p.unique_visitors} uniq</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Projects */}
        <div className="card p-5">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <MousePointer size={16} className="text-brand-400" /> Top Clicked Projects (30d)
          </h2>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-white/[0.02] rounded animate-pulse" />)}</div>
          ) : topProjects.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No project click data yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.06]">
                  {["Rank","Project","Slug","Clicks"].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-slate-500 text-xs font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {topProjects.map((p: any, i: number) => (
                    <tr key={p.project_id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-3 py-3 text-slate-500 text-sm font-mono">#{i+1}</td>
                      <td className="px-3 py-3 text-white text-sm">{p.title}</td>
                      <td className="px-3 py-3 text-slate-400 text-xs font-mono">{p.slug}</td>
                      <td className="px-3 py-3">
                        <span className="text-brand-400 font-bold text-sm">{p.clicks}</span>
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
