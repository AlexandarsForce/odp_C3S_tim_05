import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminPagination } from "../../components/admin/AdminTable";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { AuditDto } from "../../types/admin/AdminTypes";

const actionIcons: Record<string, string> = {
  "post.create": "📝",
  "post.like": "❤",
  "community.join": "👥",
  "comment.create": "💬",
  "user.login": "🔐",
  "community.create": "🏘",
  "post.delete": "🗑",
  "user.password_change": "🔑",
  user_role: "👤",
  community_delete: "🗑",
  tag_create: "🏷",
  post_delete: "📝",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const limit = 15;

  useEffect(() => {
    setLoading(true);
    adminApi.getAuditLogs(page, limit).then((r) => {
      if (r.success && r.data) {
        setLogs(r.data.items);
        setTotal(r.data.total);
      } else {
        setLogs([]);
        setTotal(0);
      }
      setLoading(false);
    });
  }, [page]);

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
      <div className="mb-[22px]">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[10px]">
          <Link to="/admin" className="text-pn-lm hover:text-pn-steel">Admin</Link>
          <span>›</span>
          <span style={{ color: "var(--color-pn-steel)", fontWeight: 600 }}>Audit Log</span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-pn-navy mb-1">Audit Log</h1>
        <p className="text-[0.875rem] text-pn-muted">Chronological record of all system events — user actions and admin operations.</p>
      </div>

      <div className="flex items-center gap-[10px] mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[0.9rem] text-pn-lm">⌕</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-pn-white border border-pn-border rounded-[10px] py-[10px] pl-9 pr-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
            placeholder="Search by user, action, or target..." />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="bg-pn-white border border-pn-border rounded-[10px] px-[14px] py-[10px] text-[0.82rem] text-pn-navy outline-none font-['DM_Sans',sans-serif]">
          <option value="all">All actions</option>
          {uniqueActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <span className="text-[0.8rem] text-pn-lm whitespace-nowrap">{total} entries</span>
      </div>

      <div className="flex flex-col gap-2">
        {loading && (
          <div className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-6 text-center text-[0.85rem] text-pn-muted">
            Loading audit log…
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-6 text-center text-[0.85rem] text-pn-muted">
            {search || actionFilter !== "all" ? "No matching entries." : "No audit entries recorded yet."}
          </div>
        )}

        {!loading && filtered.map((log) => (
          <div key={log.id} className="bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-[14px] flex items-center gap-[14px] hover:shadow-[0_3px_14px_rgba(53,88,114,0.07)] hover:border-[#D4E2ED] transition-all">
            <div className="w-[34px] h-[34px] rounded-[9px] bg-[rgba(53,88,114,0.08)] flex items-center justify-center text-[0.9rem] shrink-0">
              {actionIcons[log.action] ?? "📋"}
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
        ))}
      </div>

      {!loading && total > 0 && <AdminPagination page={page} total={total} limit={limit} onChange={setPage} />}
    </AdminLayout>
  );
}
