import { useState, useEffect } from "react";
import { Tag, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PageHeaderPill } from "../../components/admin/PageHeaderPill";
import { AdminKpiCard } from "../../components/admin/AdminKpiCard";
import { AdminTable } from "../../components/admin/AdminTable";
import { tagApi } from "../../api_services/tags/TagAPIService";
import type { TagDto } from "../../types/tag/TagTypes";

export default function TagsPage() {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [newTag, setNewTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string>("");

  const fetchTags = async () => {
    setLoading(true);
    setError("");
    const res = await tagApi.getAll();
    if (res.success && res.data) {
      setTags(res.data);
    } else {
      setError(res.message || "Failed to load tags.");
      setTags([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreate = async () => {
    const name = newTag.trim();
    if (!name) {
      setCreateError("Tag name cannot be empty.");
      return;
    }
    setCreating(true);
    setCreateError("");
    const r = await tagApi.create(name);
    setCreating(false);
    if (r.success) {
      setNewTag("");
      fetchTags();
    } else {
      setCreateError(r.message || "Failed to create tag.");
    }
  };

  const handleDelete = async (id: number) => {
    const r = await tagApi.delete(id);
    if (r.success) fetchTags();
    else setError(r.message || "Failed to delete tag.");
  };

  const filtered = tags.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));

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
            Failed to load tags
          </h3>
          <p className="text-[0.82rem] text-pn-muted leading-[1.65] max-w-[260px] mb-6">
            There was a problem fetching data from the server. Check your connection and try again.
          </p>
          <button
            onClick={fetchTags}
            className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] px-5 py-[9px] rounded-[10px] hover:bg-[rgba(180,60,60,0.13)] transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry Connection
          </button>
        </div>

      ) : (
      /* ── SCENARIO B: Normal (empty or populated) ──────────────── */
      <>
        <PageHeaderPill
          label="Tags"
          dotClass="bg-[#0d9488]"
          textClass="text-[#0d9488]"
        />

        <AdminKpiCard
          Icon={Tag}
          label="Total Tags"
          value={tags.length.toString()}
          accentHex="#0d9488"
        />

        {/* Create tag */}
        <div className="mb-4 bg-pn-white border border-pn-border rounded-[14px] px-[18px] py-[14px]">
          <div className="flex items-center gap-[10px] mb-[10px]">
            <div className="w-[26px] h-[26px] rounded-[7px] bg-[rgba(13,148,136,0.1)] text-[#0d9488] flex items-center justify-center shrink-0">
              <Plus className="h-[14px] w-[14px]" />
            </div>
            <div>
              <div className="text-[0.875rem] font-semibold text-pn-navy leading-none">Create a new tag</div>
              <div className="text-[0.72rem] text-pn-muted mt-[3px]">Tags added here become available across the platform.</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={newTag}
              onChange={(e) => { setNewTag(e.target.value); if (createError) setCreateError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && !creating) handleCreate(); }}
              disabled={creating}
              className="flex-1 min-w-[180px] bg-pn-white border border-pn-border rounded-[10px] py-[10px] px-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-[#0d9488] transition-colors disabled:opacity-60"
              placeholder="Enter tag…"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newTag.trim()}
              className="inline-flex items-center gap-[6px] text-[0.82rem] font-semibold text-white bg-[#0d9488] border border-[#0d9488] px-[16px] py-[9px] rounded-[10px] hover:bg-[#0b827a] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {createError && (
            <div className="mt-[10px] flex items-center gap-[6px] text-[0.78rem] text-[#9B3A3A]">
              <AlertCircle className="h-3.5 w-3.5" />
              {createError}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative w-full">
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
              placeholder="Search tags…"
            />
          </div>
        </div>

        {/* Table */}
        <AdminTable columns={["ID", "Tag", "Actions"]}>
          {loading && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-[0.85rem] text-pn-muted">
                Loading tags…
              </td>
            </tr>
          )}
          {!loading && filtered.length === 0 && (
            <tr>
              <td colSpan={3} className="px-4 py-8 text-center text-[0.85rem] text-pn-muted">
                {search ? "No tags match your search." : "No tags created yet."}
              </td>
            </tr>
          )}
          {!loading && filtered.map((t) => (
            <tr key={t.id} className="border-b border-pn-surface last:border-b-0 hover:bg-[rgba(53,88,114,0.025)]">
              <td className="px-4 py-3 text-[0.8rem] text-pn-lm">#{t.id}</td>
              <td className="px-4 py-3">
                <span className="text-[0.85rem] font-bold text-pn-steel bg-[rgba(53,88,114,0.09)] border border-[rgba(53,88,114,0.18)] px-[11px] py-[3px] rounded-full">
                  {t.name}
                </span>
              </td>
              <td className="px-4 py-3">
                <button
                  onClick={() => handleDelete(t.id)}
                  className="text-[0.75rem] font-semibold text-pn-red bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.18)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(180,60,60,0.14)] transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </AdminTable>
      </>
      )}

    </AdminLayout>
  );
}
