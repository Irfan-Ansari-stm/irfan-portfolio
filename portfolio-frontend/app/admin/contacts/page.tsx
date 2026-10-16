"use client";
import { useEffect, useState, useCallback } from "react";
import { Mail, CheckCircle, Archive, Trash2, Search, ChevronLeft, ChevronRight, MessageCircle, X } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import type { Contact, ContactStats } from "@/types";
import { cn, formatDate } from "@/lib/utils";

function ContactModal({ contact, onClose, onUpdate }: { contact: Contact; onClose: () => void; onUpdate: () => void }) {
  async function setStatus(status: string) {
    try {
      await adminApi.updateContactStatus(contact.id, status);
      toast.success(`Marked as ${status}`);
      onUpdate();
    } catch { toast.error("Failed to update status"); }
  }

  const statusActions = [
    { label: "Mark Replied", value: "replied", icon: CheckCircle, color: "text-emerald-600 dark:text-brand-400" },
    { label: "Archive", value: "archived", icon: Archive, color: "text-slate-500 dark:text-slate-400" },
    { label: "Mark Unread", value: "unread", icon: Mail, color: "text-amber-600 dark:text-amber-400" },
  ].filter((a) => a.value !== contact.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/[0.08]">
          <h2 className="text-slate-900 dark:text-white text-lg font-bold">Message Details</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3.5">
              <div className="text-slate-500 text-xs mb-1 font-medium">From</div>
              <div className="text-slate-900 dark:text-white text-sm font-semibold truncate">{contact.name}</div>
              <a href={`mailto:${contact.email}`} className="text-emerald-600 dark:text-emerald-400 text-xs hover:underline truncate block mt-0.5">{contact.email}</a>
            </div>
            <div className="card p-3.5">
              <div className="text-slate-500 text-xs mb-1 font-medium">Received</div>
              <div className="text-slate-900 dark:text-white text-sm font-medium">{formatDate(contact.created_at)}</div>
              <div className="text-slate-500 text-xs font-mono mt-0.5">{contact.ip_address || "Unknown IP"}</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-1.5 font-semibold uppercase tracking-wider">Subject</div>
            <div className="text-slate-900 dark:text-white text-sm font-medium">{contact.subject}</div>
          </div>
          <div className="card p-4">
            <div className="text-slate-500 dark:text-slate-400 text-xs mb-2 font-semibold uppercase tracking-wider">Message</div>
            <p className="text-slate-800 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
          </div>
          <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-200 dark:border-white/[0.08]">
            <a href={`mailto:${contact.email}?subject=Re: ${encodeURIComponent(contact.subject)}`}
              className="btn-primary text-xs px-4 py-2.5">
              <Mail size={14} />Reply via Email
            </a>
            {statusActions.map((a) => (
              <button key={a.value} onClick={() => { setStatus(a.value); onClose(); }}
                className={cn("btn-outline text-xs px-3.5 py-2.5", a.color)}>
                <a.icon size={14} />{a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 10 };
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const [cres, sres] = await Promise.all([adminApi.getContacts(params), adminApi.getContactStats()]);
      setContacts(cres.data.data || []);
      setPagination(cres.data.pagination);
      setStats(sres.data.data);
    } catch {}
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  async function deleteContact(id: string) {
    if (!confirm("Delete this message permanently?")) return;
    try { await adminApi.deleteContact(id); toast.success("Message deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  }

  function openContact(c: Contact) {
    setSelected(c);
    if (c.status === "unread") {
      adminApi.updateContactStatus(c.id, "read").then(() => load()).catch(() => {});
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      unread: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      read: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      replied: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      archived: "text-slate-500 dark:text-slate-400 bg-slate-500/10 border-slate-500/20",
    };
    return <span className={cn("status-badge", map[s] || "text-slate-400 bg-slate-500/10 border-slate-500/20")}>{s}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Contact Messages</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-0.5">Inquiries and messages submitted through your portfolio contact form.</p>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Unread", value: stats.unread, color: "text-amber-600 dark:text-amber-400" },
              { label: "Read", value: stats.read, color: "text-blue-600 dark:text-blue-400" },
              { label: "Replied", value: stats.replied, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "This Week", value: stats.last_7_days, color: "text-purple-600 dark:text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="card p-5 text-center">
                <div className={cn("text-3xl font-bold tracking-tight mb-1", s.color)}>{s.value}</div>
                <div className="text-slate-600 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search by name, email, subject..." />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["all","unread","read","replied","archived"].map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={cn("px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all capitalize cursor-pointer",
                  status === s ? "bg-emerald-500 text-neutral-950 font-semibold shadow-sm" : "bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/[0.06]")}>
                {s}{s === "unread" && stats?.unread && stats.unread !== "0" && (
                  <span className={cn("ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold", status === s ? "bg-neutral-950/20 text-neutral-950" : "bg-amber-500/20 text-amber-600 dark:text-amber-400")}>
                    {stats.unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" /></div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Mail size={36} className="text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 text-sm">No messages found matching your criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02]">
                    {["Sender", "Subject & Message", "Status", "Date", "Actions"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/[0.04]">
                  {contacts.map((c) => (
                    <tr key={c.id} onClick={() => openContact(c)}
                      className={cn("hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer transition-colors",
                        c.status === "unread" ? "bg-amber-500/[0.06] font-medium" : "")}>
                      <td className="px-5 py-4">
                        <div className="text-slate-900 dark:text-white text-sm font-semibold truncate max-w-[180px]">{c.name}</div>
                        <div className="text-slate-500 text-xs truncate max-w-[180px]">{c.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-800 dark:text-slate-200 text-sm line-clamp-1 max-w-md font-medium">{c.subject}</div>
                        <div className="text-slate-500 text-xs line-clamp-1 max-w-md mt-0.5">{c.message}</div>
                      </td>
                      <td className="px-5 py-4">{statusBadge(c.status)}</td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openContact(c)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors" title="View Message">
                            <MessageCircle size={15} />
                          </button>
                          <button onClick={() => deleteContact(c.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-400 hover:text-red-500 transition-colors" title="Delete Message">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-slate-500 text-xs">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={!pagination.hasPrev} onClick={() => setPage((p) => p - 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"><ChevronLeft size={14} /></button>
              <button disabled={!pagination.hasNext} onClick={() => setPage((p) => p + 1)} className="btn-outline text-xs px-3 py-1.5 disabled:opacity-40"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
      {selected && <ContactModal contact={selected} onClose={() => setSelected(null)} onUpdate={() => { load(); setSelected(null); }} />}
    </AdminLayout>
  );
}
