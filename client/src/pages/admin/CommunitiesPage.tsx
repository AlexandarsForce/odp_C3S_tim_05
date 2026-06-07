import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { CommunityDto } from "../../types/community/CommunityTypes";

const LIMIT = 20;

const initials = (name: string) => (name?.trim()?.charAt(0) ?? "?").toUpperCase();

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const monthsAgo = (iso: string) => {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months <= 0) return "this month";
  if (months === 1) return "1 month ago";
  if (months < 12) return `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
};

export default function AdminCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [toDelete, setToDelete] = useState<CommunityDto | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = async (p = page) => {
    setLoading(true);
    setError(null);
    const res = await adminApi.getAllCommunities(p, LIMIT);
    if (res.success && res.data) {
      setCommunities(res.data.items);
      setTotal(res.data.total);
    } else {
      setError(res.message || "Failed to load communities.");
      setCommunities([]);
      setTotal(0);
    }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return communities;
    return communities.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  }, [communities, search]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const pageStart = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const pageEnd = Math.min(page * LIMIT, total);

  const openDelete = (c: CommunityDto) => {
    setToDelete(c);
    setConfirmText("");
  };

  const closeDelete = () => {
    if (deleting) return;
    setToDelete(null);
    setConfirmText("");
  };

  const confirmDelete = async () => {
    if (!toDelete || confirmText !== toDelete.name) return;
    setDeleting(true);
    const res = await adminApi.deleteCommunity(toDelete.id);
    setDeleting(false);
    if (res.success) {
      setToDelete(null);
      setConfirmText("");
      await load(page);
    } else {
      setError(res.message || "Failed to delete community.");
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[10px]">
        <Link to="/admin" className="text-pn-lm hover:text-pn-steel">Admin</Link>
        <span>›</span>
        <span style={{ color: "var(--color-pn-steel)", fontWeight: 600 }}>All Communities</span>
      </div>

      <div className="flex items-end justify-between gap-4 flex-wrap mb-[22px]">
        <div>
          <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-pn-navy mb-1">All Communities</h1>
          <p className="text-[0.875rem] text-pn-muted">
            Full system view — all communities regardless of visibility.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-w-[420px]">
        <div className="bg-pn-white border border-pn-border rounded-[16px] px-[18px] py-4">
          <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-pn-lm mb-[6px]">Total</div>
          <div className="font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-pn-navy leading-none mb-1">
            {total}
          </div>
          <div className="text-[0.72rem] text-pn-muted">communities in the system</div>
        </div>
        <div className="bg-pn-white border border-pn-border rounded-[16px] px-[18px] py-4">
          <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-pn-lm mb-[6px]">On This Page</div>
          <div className="font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-pn-navy leading-none mb-1">
            {communities.length}
          </div>
          <div className="text-[0.72rem] text-pn-muted">page {page} of {totalPages}</div>
        </div>
      </div>

      <div className="flex items-center gap-[10px] mb-[14px] flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-pn-lm pointer-events-none">⌕</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description (current page)…"
            className="w-full py-[10px] pl-[36px] pr-[14px] bg-pn-white border border-pn-border rounded-[10px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] focus:border-pn-sky placeholder:text-pn-lm"
          />
        </div>
        <span className="text-[0.8rem] text-pn-lm whitespace-nowrap">
          {total} {total === 1 ? "community" : "communities"}
        </span>
      </div>

      {error && (
        <div className="rounded-[14px] px-[18px] py-[12px] mb-4 bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] text-[0.85rem] text-[#9B3A3A]">
          {error}
        </div>
      )}

      <div className="bg-pn-white border border-pn-border rounded-[20px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[0.875rem]">
            <thead>
              <tr className="border-b border-pn-border">
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm whitespace-nowrap min-w-[260px]">Community</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm whitespace-nowrap">Type</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm whitespace-nowrap">Owner</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm whitespace-nowrap">Created</th>
                <th className="text-left px-4 py-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[0.85rem] text-pn-muted">
                    Loading communities…
                  </td>
                </tr>
              )}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[0.85rem] text-pn-muted">
                    {search ? "No matches on this page." : "No communities found."}
                  </td>
                </tr>
              )}

              {!loading && filtered.map((c) => (
                <tr key={c.id} className="border-b border-pn-surface last:border-b-0 hover:bg-[rgba(53,88,114,0.025)] transition-colors">
                  <td className="px-4 py-[14px] align-middle">
                    <div className="flex items-center gap-[13px]">
                      {c.avatarPicture ? (
                        <img
                          src={c.avatarPicture}
                          alt={c.name}
                          className="w-[42px] h-[42px] rounded-[11px] object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-[42px] h-[42px] rounded-[11px] flex-shrink-0 bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[1rem] font-bold text-white">
                          {initials(c.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-['Cormorant_Garamond',serif] text-[1rem] font-semibold text-pn-navy max-w-[220px] truncate">
                          <Link to={`/community/${c.id}`} className="hover:text-pn-steel">{c.name}</Link>
                        </div>
                        <div className="text-[0.72rem] text-pn-lm mt-[1px]">#{c.id}</div>
                        {c.description && (
                          <div className="text-[0.78rem] text-pn-muted mt-[3px] max-w-[260px] truncate">
                            {c.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-[14px] align-middle">
                    {c.type === "private" ? (
                      <span className="inline-block text-[0.7rem] font-bold text-[#5A3E7A] bg-[rgba(90,62,122,0.09)] border border-[rgba(90,62,122,0.2)] px-[10px] py-[3px] rounded-md whitespace-nowrap">
                        Private
                      </span>
                    ) : (
                      <span className="inline-block text-[0.7rem] font-bold text-pn-steel bg-[rgba(53,88,114,0.09)] border border-[rgba(53,88,114,0.2)] px-[10px] py-[3px] rounded-md whitespace-nowrap">
                        Public
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-[14px] align-middle">
                    <Link to={`/profile/${c.ownerId}`} className="text-[0.82rem] font-medium text-pn-navy hover:text-pn-steel whitespace-nowrap">
                      user #{c.ownerId}
                    </Link>
                  </td>
                  <td className="px-4 py-[14px] align-middle">
                    <div className="text-[0.8rem] text-pn-muted whitespace-nowrap">{formatDate(c.createdAt)}</div>
                    <div className="text-[0.68rem] text-pn-lm mt-[1px]">{monthsAgo(c.createdAt)}</div>
                  </td>
                  <td className="px-4 py-[14px] align-middle">
                    <div className="flex gap-[6px] items-center">
                      <Link
                        to={`/community/${c.id}`}
                        className="text-[0.75rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.15)] px-3 py-[5px] rounded-[7px] whitespace-nowrap hover:bg-[rgba(53,88,114,0.15)] transition-colors">
                        View
                      </Link>
                      <button
                        onClick={() => openDelete(c)}
                        className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.18)] px-3 py-[5px] rounded-[7px] whitespace-nowrap hover:bg-[rgba(180,60,60,0.14)] transition-colors cursor-pointer">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-pn-surface flex-wrap gap-3">
            <span className="text-[0.8rem] text-pn-lm">
              Showing {pageStart}–{pageEnd} of {total} communities
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold text-pn-muted bg-pn-white border border-pn-border disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-pn-sky hover:enabled:text-pn-steel cursor-pointer">
                ‹
              </button>
              <span className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold bg-pn-steel text-white border border-pn-steel">
                {page}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold text-pn-muted bg-pn-white border border-pn-border disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-pn-sky hover:enabled:text-pn-steel cursor-pointer">
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {toDelete && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeDelete(); }}
          className="fixed inset-0 z-[500] bg-[rgba(26,39,51,0.45)] backdrop-blur-[4px] flex items-center justify-center p-6">
          <div className="bg-pn-white border border-pn-border rounded-[22px] px-8 py-9 max-w-[480px] w-full shadow-[0_24px_64px_rgba(26,39,51,0.18)]">
            <div className="w-[52px] h-[52px] rounded-[14px] bg-[rgba(180,60,60,0.1)] border border-[rgba(180,60,60,0.2)] flex items-center justify-center text-[1.4rem] mb-5">🗑</div>
            <h2 className="font-['Cormorant_Garamond',serif] text-[1.5rem] font-bold text-pn-navy mb-[10px]">Delete Community</h2>
            <p className="text-[0.9rem] leading-[1.7] text-pn-muted mb-[10px]">
              This action is <strong>permanent and irreversible</strong>. Deleting this community will cascade and remove all associated data from the system.
            </p>

            <div className="bg-pn-surface border border-pn-border rounded-[12px] px-4 py-3 mb-[18px] flex items-center gap-3">
              {toDelete.avatarPicture ? (
                <img src={toDelete.avatarPicture} alt={toDelete.name} className="w-9 h-9 rounded-[9px] object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-[9px] flex-shrink-0 bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.9rem] font-bold text-white">
                  {initials(toDelete.name)}
                </div>
              )}
              <div>
                <div className="text-[0.9rem] font-semibold text-pn-navy">{toDelete.name}</div>
                <div className="text-[0.75rem] text-pn-lm mt-[2px]">#{toDelete.id} · {toDelete.type === "private" ? "Private" : "Public"}</div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[0.72rem] font-bold tracking-[0.08em] uppercase text-[#9B3A3A] mb-2">⚠ The following will also be permanently deleted:</div>
              {[
                "All posts in this community",
                "All comments on those posts",
                "All likes and reactions on posts and comments",
                "All member relationships",
                "Community moderator assignments and join requests",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-[0.83rem] text-pn-muted py-[5px] border-b border-pn-surface last:border-b-0">
                  <span className="w-[6px] h-[6px] rounded-full bg-[rgba(180,60,60,0.5)] flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>

            <div className="text-[0.8rem] font-semibold text-pn-navy mb-[7px]">
              Type <code className="font-mono bg-[rgba(180,60,60,0.08)] text-[#9B3A3A] px-[6px] py-[1px] rounded text-[0.85em]">{toDelete.name}</code> to confirm deletion:
            </div>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type community name here…"
              autoFocus
              className="w-full px-[14px] py-[10px] bg-pn-surface border-[1.5px] border-pn-border rounded-[10px] text-[0.9rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] mb-[18px] transition-colors focus:border-[rgba(180,60,60,0.5)] placeholder:text-pn-lm"
            />

            <div className="flex gap-[10px]">
              <button
                onClick={closeDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-[10px] text-[0.9rem] font-semibold text-pn-steel bg-pn-white border-[1.5px] border-pn-border hover:border-pn-sky disabled:opacity-50 cursor-pointer">
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={confirmText !== toDelete.name || deleting}
                className="flex-1 py-3 rounded-[10px] text-[0.9rem] font-semibold text-white bg-[#C0392B] shadow-[0_4px_14px_rgba(192,57,43,0.28)] hover:enabled:bg-[#a93226] flex items-center justify-center gap-[7px] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                </svg>
                {deleting ? "Deleting…" : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
