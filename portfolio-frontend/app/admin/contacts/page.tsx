"use client";
import { useEffect, useState, useCallback } from "react";
import { Mail, Trash2, Search, ChevronLeft, ChevronRight, X, Archive, CheckCircle, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import AdminLayout from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/api";
import type { Contact, ContactStats } from "@/types";
import { cn, formatDate } from "@/lib/utils";

function ContactModal({ contact, onClose, onUpdate }: { contact: Contact; onClose: () => void; onUpdate: () => void }) {
  async function setStatus(status: string) {
    try { await adminApi.updateContactStatus(contact.id, status); onUpdate(); }
    catch { toast.error("Failed to update status"); }
  }

  const statusActions = [
    { label: "Mark Replied", value: "replied", icon: CheckCircle, color: "text-brand-400" },
    { label: "Archive", value: "archived", icon: Archive, color: "text-slate-400" },
    { label: "Mark Unread", value: "unread", icon: Mail, color: "text-amber-400" },
  ].filter((a) => a.value !== contact.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-white font-bold">Message Details</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-3">
              <div className="text-slate-500 text-xs mb-1">From</div>
              <div className="text-white text-sm font-medium">{contact.name}</div>
              <a href={`mailto:${contact.email}`} className="text-brand-400 text-xs hover:underline">{contact.email}</a>
            </div>
            <div className="card p-3">
              <div className="text-slate-500 text-xs mb-1">Received</div>
              <div className="text-white text-sm">{formatDate(contact.created_at)}</div>
              <div className="text-slate-500 text-xs">{contact.ip_address}</div>
            </div>
          </div>
          <div className="card p-4">
            <div className="text-slate-500 text-xs mb-2 font-semibold uppercase tracking-wide">Subject</div>
            <div className="text-white text-sm font-medium">{contact.subject}</div>
          </div>
          <div className="card p-4">
            <div className="text-slate-500 text-xs mb-2 font-semibold uppercase tracking-wide">Message</div>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{contact.message}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`mailto:${contact.email}?subject=Re: ${contact.subject}`}
              className="btn-primary text-xs px-4 py-2"><Mail size={13} />Reply via Email</a>
            {statusActions.map((a) => (
              <button key={a.value} onClick={() => { setStatus(a.value); onClose(); }}
                className={cn("btn-outline text-xs px-3 py-2", a.color)}>
                <a.icon size={13} />{a.label}
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
      const params: any = { page, limit: 15 };
      if (status !== "all") params.status = status;
      if (search) params.search = search;
      const [res, statsRes] = await Promise.all([adminApi.getContacts(params), adminApi.getContactStats()]);
      setContacts(res.data.data || []);
      setPagination(res.data.pagination);
      setStats(statsRes.data.data);
    } catch {}
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { load(); }, [load]);

  async function openContact(contact: Contact) {
    if (contact.status === "unread") {
      try { await adminApi.updateContactStatus(contact.id, "read"); } catch {}
    }
    setSelected(contact);
  }

  async function deleteContact(id: string) {
    if (!confirm("Delete this message permanently?")) return;
    try { await adminApi.deleteContact(id); toast.success("Message deleted"); load(); }
    catch { toast.error("Failed to delete"); }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      unread: "text-amber-400 bg-amber-500/15 font-bold", read: "text-blue-400 bg-blue-500/15",
      replied: "text-brand-400 bg-brand-500/15", archived: "text-slate-400 bg-slate-500/15",
    };
    return <span className={cn("status-badge", map[s])}>{s}</span>;
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Contact Inbox</h1>
          <p className="text-slate-500 text-sm mt-0.5">{stats?.total ?? 0} total messages</p>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Unread", value: stats.unread, color: "text-amber-400" },
              { label: "Read", value: stats.read, color: "text-blue-400" },
              { label: "Replied", value: stats.replied, color: "text-brand-400" },
              { label: "This Week", value: stats.last_7_days, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="card p-4 text-center">
                <div className={cn("text-2xl font-bold mb-1", s.color)}>{s.value}</div>
                <div className="text-slate-500 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input pl-10 text-sm" placeholder="Search by name, email, subject..." />
          </div>
          <div className="flex gap-2 flex-wrap">
            {["all","unread","read","replied","archived"].map((s) => (
              <button key={s} onClick={() => { setStatus(s); setPage(1); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                  status === s ? "bg-brand-500 text-dark-900" : "glass text-slate-400 hover:text-white")}>
                {s}{s === "unread" && stats?.unread !== "0" ? ` (${stats?.unread})` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto" /></div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Mail size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">No messages found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-white/[0.06]">
                  {["Sender","Subject","Status","Date","Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-slate-500 text-xs font-semibold uppercase tracking-wide">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} onClick={() => openContact(c)}
                      className={cn("border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors",
                        c.status === "unread" && "bg-amber-500/[0.03]")}>
                      <td className="px-4 py-3">
                        <div className="text-white text-sm font-medium">{c.name}</div>
                        <div className="text-slate-500 text-xs">{c.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-300 text-sm line-clamp-1">{c.subject}</p>
                        <p className="text-slate-500 text-xs line-clamp-1">{c.message.slice(0, 60)}…</p>
                      </td>
                      <td className="px-4 py-3">{statusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{formatDate(c.created_at)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button onClick={() => openContact(c)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-brand-400 transition-colors"><MessageCircle size={14} /></button>
                          <button onClick={() => deleteContact(c.id)} className="p-1.5 rounded hover:bg-white/5 text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
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
