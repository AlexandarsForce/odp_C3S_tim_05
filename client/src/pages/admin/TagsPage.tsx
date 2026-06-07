import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminTable } from "../../components/admin/AdminTable";
import { tagApi } from "../../api_services/tags/TagAPIService";
import type { TagDto } from "../../types/tag/TagTypes";

export default function TagsPage() {
  const [tags, setTags] = useState<TagDto[]>([]);
  const [search, setSearch] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTags = async () => {
    setLoading(true);
    setError(null);
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
    if (!newTagName.trim()) return;
    const r = await tagApi.create(newTagName.trim());
    if (r.success) {
      setNewTagName("");
      fetchTags();
    } else {
      setError(r.message || "Failed to create tag.");
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
      <div className="mb-[22px]">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[10px]">
          <Link to="/admin" className="text-pn-lm hover:text-pn-steel">Admin</Link>
          <span>›</span>
          <span style={{ color: "var(--color-pn-steel)", fontWeight: 600 }}>Tag Management</span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-pn-navy mb-1">Tag Management</h1>
        <p className="text-[0.875rem] text-pn-muted">Create and manage global tags available to all users when writing posts.</p>
      </div>

      <div className="bg-pn-white border border-pn-border rounded-[20px] p-6 mb-5">
        <div className="font-['Cormorant_Garamond',serif] text-[1.2rem] font-semibold text-pn-navy mb-1">Create Global Tag</div>
        <p className="text-[0.82rem] text-pn-muted mb-[18px]">Global tags are visible to all users across the network when composing posts. They appear in the tag picker on the post editor.</p>
        <div className="flex gap-[10px] items-start flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full bg-pn-surface border-[1.5px] border-pn-border rounded-[11px] px-4 py-[11px] text-[0.9rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
              placeholder="e.g. DevOps, AI Safety, Web3..." />
            <div className="text-[0.75rem] text-pn-lm mt-[7px]">Press Enter or click Create. Tag names must be unique and under 32 characters.</div>
          </div>
          <button onClick={handleCreate}
            className="inline-flex items-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.9rem] px-[22px] py-[11px] rounded-[11px] shadow-[0_5px_16px_rgba(53,88,114,0.2)] hover:bg-[#2a4760] transition-colors whitespace-nowrap cursor-pointer">
            + Create Tag
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[14px] px-[18px] py-[12px] mb-4 bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)] text-[0.85rem] text-[#9B3A3A]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-[10px] mb-[14px] flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[0.9rem] text-pn-lm">⌕</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-pn-white border border-pn-border rounded-[10px] py-[10px] pl-9 pr-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
            placeholder="Search tags…" />
        </div>
        <span className="text-[0.8rem] text-pn-lm whitespace-nowrap">{tags.length} tags total</span>
      </div>

      <AdminTable columns={["ID", "Tag", "Actions"]}>
        {loading && (
          <tr>
            <td colSpan={3} className="px-4 py-8 text-center text-[0.85rem] text-pn-muted">Loading tags…</td>
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
              <span className="text-[0.85rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.09)] border border-[rgba(53,88,114,0.18)] px-[11px] py-[3px] rounded-full">
                {t.name}
              </span>
            </td>
            <td className="px-4 py-3">
              <button onClick={() => handleDelete(t.id)}
                className="text-[0.75rem] font-semibold text-pn-red bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.18)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(180,60,60,0.14)] transition-colors cursor-pointer">
                Delete
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>
    </AdminLayout>
  );
}
