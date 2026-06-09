import { useState, useEffect } from "react";
import {
  ClipboardList,
  BookOpen,
  AlertCircle,
  RefreshCw,
  FileText,
  Heart,
  Building2,
  MessageSquare,
  Lock,
  Key,
  Users,
  Tag,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminPagination } from "../../components/admin/AdminTable";
import { PageHeaderPill } from "../../components/admin/PageHeaderPill";
import { AdminSelect } from "../../components/admin/AdminSelect";
import { AdminKpiCard } from "../../components/admin/AdminKpiCard";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { AuditDto } from "../../types/admin/AdminTypes";

const actionIcons: Record<string, LucideIcon> = {
  "post.create": FileText,
  "post.like": Heart,
  "community.join": Building2,
  "comment.create": MessageSquare,
  "user.login": Lock,
  "community.create": Building2,
  "post.delete": Trash2,
  "user.password_change": Key,
  user_role: Users,
  community_delete: Trash2,
  tag_create: Tag,
  post_delete: FileText,
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const limit = 15;

  const fetchLogs = () => {
    setLoading(true);
    setError("");
    adminApi.getAuditLogs(page, limit).then((r) => {
      if (r.success && r.data) {
        setLogs(r.data.items);
        setTotal(r.data.total);
      } else {
        setError(r.message || "Failed to load audit log.");
        setLogs([]);
        setTotal(0);
      }
      setLoading(false);
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLogs(); }, [page]);

  const filtered = logs
    .filter((l) => actionFilter === "all" || l.action === actionFilter)
    .filter((l) => !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.username?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase())
    );

  const uniqueActions = Array.from(new Set(logs.map((l) => l.action)));

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <AdminLayout>

      {/* ── SCENARIO A: Error ────────────────────────────────────── */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center select-none">
          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute rounded-full bg-[rgba(180,60,60,0.1)]" style={{ width: "6rem", height: "6rem" }} />
            <div className="absolute rounded-full bg-[rgba(180,60,60,0.15)]" style={{ width: "4.5rem", height: "4.5rem" }} />
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(180,60,60,0.1)] border border-[rgba(180,60,60,0.2)]">
              <AlertCircle className="h-6 w-6 text-[#9B3A3A]" />
            </div>
          </div>
          <h3 className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[6px]">
            Failed to load audit log
          </h3>
          <p className="text-[0.82rem] text-pn-muted leading-[1.65] max-w-[260px] mb-6">
              {error}
          </p>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] px-5 py-[9px] rounded-[10px] hover:bg-[rgba(180,60,60,0.13)] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>

      ) : (
      /* ── SCENARIO B: Normal ────────────────────────────────────── */
      <>
        <PageHeaderPill
          label="Audit Log"
          dotClass="bg-[#d97706]"
          textClass="text-[#d97706]"
        />

        <AdminKpiCard
          Icon={ClipboardList}
          label="Total Entries"
          value={total.toLocaleString()}
          accentHex="#d97706"
        />

        {/* Toolbar — search full width + action filter */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-pn-lm pointer-events-none select-none">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-pn-white border border-pn-border rounded-[10px] py-[10px] pl-[44px] pr-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
              placeholder="Search by user, action, or target…"
            />
          </div>
          <AdminSelect
            value={actionFilter}
            onChange={setActionFilter}
            options={[
              { value: "all", label: "All actions" },
              ...uniqueActions.map((a) => ({ value: a, label: a })),
            ]}
          />
        </div>

        {/* Log list */}
        <div className="flex flex-col gap-2">
          {loading && (
            <div className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-6 text-center text-[0.85rem] text-pn-muted">
              Loading audit log…
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-6 flex items-center justify-center gap-[10px] text-[0.85rem] text-pn-muted">
              <BookOpen className="h-4 w-4 text-pn-lm" />
              {search || actionFilter !== "all" ? "No matching entries." : "No audit entries recorded yet."}
            </div>
          )}

          {!loading && filtered.map((log) => {
            const Icon = actionIcons[log.action] ?? ClipboardList;
            return (
              <div key={log.id} className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-[14px] flex items-center gap-[14px] hover:shadow-[0_3px_14px_rgba(53,88,114,0.07)] hover:border-[#D4E2ED] transition-all">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-[rgba(217,119,6,0.1)] text-[#d97706] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.875rem] font-semibold text-pn-navy">{log.action}</div>
                  <div className="text-[0.78rem] text-pn-muted mt-[2px]">
                    {log.details?.startsWith("{") ? (
                      (() => {
                        try {
                          const d = JSON.parse(log.details);
                          return Object.entries(d).map(([k, v]) => (
                            <span key={k} className="mr-2"><span className="text-pn-steel font-semibold">{k}:</span> {String(v)}</span>
                          ));
                        } catch { return <span>{log.details}</span>; }
                      })()
                    ) : (
                      <span>{log.details}</span>
                    )}
                  </div>
                  <div className="text-[0.72rem] text-pn-lm flex items-center gap-1 mt-[3px]">
                    by <strong className="text-pn-muted font-semibold">{log.username ?? "system"}</strong>
                    {log.userId && <span className="text-pn-lm">· User #{log.userId}</span>}
                  </div>
                </div>
                <div className="text-[0.75rem] text-pn-lm whitespace-nowrap shrink-0">
                  {formatTime(log.createdAt)}
                </div>
              </div>
            );
          })}
        </div>

        {!loading && total > 0 && <AdminPagination page={page} total={total} limit={limit} onChange={setPage} />}
      </>
      )}

    </AdminLayout>
  );
}
