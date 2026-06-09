import { useState, useEffect } from "react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { PageHeaderPill } from "../../components/admin/PageHeaderPill";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { DbNodeDto } from "../../types/admin/AdminTypes";

export default function HealthPage() {
  const [nodes, setNodes] = useState<DbNodeDto[]>([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const fetchHealth = async () => {
    setLoading(true);
    setError("");
    const res = await adminApi.getDbHealth();
    if (res.success && res.data) {
      setNodes(res.data);
      setLastUpdated(new Date().toLocaleTimeString());
    } else {
      setError(res.message || "Failed to load DB health.");
    }
    setLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const displayNodes = nodes;
  const degradedCount = displayNodes.filter(n => n.status !== "healthy").length;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <PageHeaderPill
          label="DB Health"
          dotClass="bg-pn-green"
          textClass="text-pn-green"
          className=""
        />
        <div className="flex items-center gap-3">
          <div className="text-[0.75rem] text-pn-lm">Last updated: {lastUpdated || "—"}</div>
          <button onClick={fetchHealth}
            className="inline-flex items-center gap-[6px] text-[0.82rem] font-semibold text-pn-steel bg-pn-white border border-pn-border px-[18px] py-[9px] rounded-[10px] hover:border-pn-sky transition-colors cursor-pointer">
            ↻ Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-[18px] px-[22px] py-4 mb-[22px] flex items-center gap-[14px] bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.2)]">
          <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] shrink-0 bg-[rgba(180,60,60,0.12)]">⚠️</div>
          <div>
            <div className="text-[0.95rem] font-semibold text-pn-navy mb-[2px]">Failed to load cluster health</div>
            <div className="text-[0.78rem] text-pn-muted">{error}</div>
          </div>
        </div>
      )}

      {loading && !error && (
        <div className="rounded-[18px] px-[22px] py-6 mb-[22px] text-center text-[0.85rem] text-pn-muted bg-pn-white border border-pn-border">
          Loading cluster health…
        </div>
      )}

      {!loading && !error && displayNodes.length === 0 && (
        <div className="rounded-[18px] px-[22px] py-6 mb-[22px] text-center text-[0.85rem] text-pn-muted bg-pn-white border border-pn-border">
          No database nodes reported.
        </div>
      )}

      {!loading && !error && displayNodes.length > 0 && (
      <>
      <div className={`rounded-[18px] px-[22px] py-4 mb-[22px] flex items-center gap-[14px] ${
        degradedCount === 0
          ? "bg-[rgba(44,122,75,0.07)] border border-[rgba(44,122,75,0.2)]"
          : "bg-[rgba(195,150,40,0.07)] border border-[rgba(195,150,40,0.2)]"
      }`}>
        <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-[1.1rem] shrink-0 ${
          degradedCount === 0 ? "bg-[rgba(44,122,75,0.12)]" : "bg-[rgba(195,150,40,0.12)]"
        }`}>
          {degradedCount === 0 ? "✅" : "⚠️"}
        </div>
        <div>
          <div className="text-[0.95rem] font-semibold text-pn-navy mb-[2px]">
            {degradedCount === 0 ? "Cluster Healthy" : `Cluster Degraded — ${degradedCount} of ${displayNodes.length} nodes reporting issues`}
          </div>
          <div className="text-[0.78rem] text-pn-muted">
            {degradedCount === 0
              ? "All nodes are operating normally."
              : `${degradedCount} node(s) require attention.`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 mb-6">
        {displayNodes.map((node, i) => (
          <div key={i} className={`bg-pn-white border rounded-[20px] p-[22px] hover:shadow-[0_6px_22px_rgba(53,88,114,0.08)] transition-shadow ${
            node.status === "degraded" ? "border-[rgba(195,150,40,0.35)] shadow-[0_0_0_2px_rgba(195,150,40,0.08)]" : "border-pn-border"
          }`}>
            <div className="flex items-center justify-between mb-[18px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[11px] bg-[rgba(53,88,114,0.08)] flex items-center justify-center text-[1rem]">
                  {node.name.includes("Master") ? "🗄" : "📋"}
                </div>
                <div>
                  <div className="font-['Cormorant_Garamond',serif] text-[1.1rem] font-semibold text-pn-navy">{node.name}</div>
                  <div className="text-[0.7rem] font-bold tracking-[0.06em] uppercase text-pn-lm mt-[2px]">
                    {node.name.includes("Master") ? "Read + Write" : "Read Only"}
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center gap-[5px] text-[0.72rem] font-bold tracking-[0.04em] uppercase px-[11px] py-[4px] rounded-full border ${
                node.status === "healthy"
                  ? "text-pn-green bg-[rgba(44,122,75,0.1)] border-[rgba(44,122,75,0.2)]"
                  : node.status === "degraded"
                  ? "text-[#7A6020] bg-[rgba(195,150,40,0.1)] border-[rgba(195,150,40,0.2)]"
                  : "text-pn-red bg-[rgba(180,60,60,0.1)] border-[rgba(180,60,60,0.2)]"
              }`}>
                <span className={`w-[6px] h-[6px] rounded-full ${
                  node.status === "healthy" ? "bg-pn-green" : node.status === "degraded" ? "bg-[#B87E20]" : "bg-[#C0392B]"
                }`} />
                {node.status === "healthy" ? "Healthy" : node.status === "degraded" ? "Degraded" : "Unreachable"}
              </span>
            </div>
            <div className="text-[0.85rem] font-semibold text-pn-navy mb-[14px] font-mono">{node.host}:{node.port}</div>
            <div className="grid grid-cols-3 gap-[10px] mb-4">
              <div className="bg-pn-surface rounded-[10px] p-[10px]">
                <div className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-pn-lm mb-1">IO Thread</div>
                <div className={`text-[0.9rem] font-semibold ${node.status === "healthy" ? "text-pn-green" : "text-pn-red"}`}>
                  {node.status === "healthy" ? "Running" : "Warning"}
                </div>
              </div>
              <div className="bg-pn-surface rounded-[10px] p-[10px]">
                <div className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-pn-lm mb-1">Queries/s</div>
                <div className="text-[0.9rem] font-semibold text-pn-navy">{(node.successfulWrites || 0).toLocaleString()}</div>
              </div>
              <div className="bg-pn-surface rounded-[10px] p-[10px]">
                <div className="text-[0.65rem] font-bold tracking-[0.08em] uppercase text-pn-lm mb-1">{node.name.includes("Master") ? "Failed Writes" : "Lag"}</div>
                <div className={`text-[0.9rem] font-semibold ${node.repLagMs && node.repLagMs > 500 ? "text-[#B87E20]" : "text-pn-green"}`}>
                  {node.name.includes("Master")
                    ? (node.failedWrites ?? 0).toLocaleString()
                    : (node.repLagMs ? `${(node.repLagMs / 1000).toFixed(0)}s` : "—")}
                </div>
              </div>
            </div>
            {node.status === "degraded" && node.repLagMs > 500 && (
              <div className="bg-[rgba(180,60,60,0.06)] border border-[rgba(180,60,60,0.18)] rounded-[10px] px-[14px] py-[10px] text-[0.78rem] text-pn-red leading-[1.5] mb-3">
                <strong className="font-semibold">Replication lag warning:</strong> Slave is {(node.repLagMs / 1000).toFixed(0)} seconds behind the master.
              </div>
            )}
            <div className="text-[0.72rem] text-pn-lm mt-[14px] pt-3 border-t border-pn-surface">
              Checked {new Date(node.lastCheck).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
      </>
      )}

      <div className="bg-pn-white border border-pn-border rounded-[16px] px-[22px] py-[18px]">
        <div className="text-[0.78rem] font-bold text-pn-lm uppercase tracking-[0.1em] mb-3">Status Legend</div>
        <div className="flex flex-col gap-[10px]">
          {[
            { cls: "text-pn-green bg-[rgba(44,122,75,0.1)] border-[rgba(44,122,75,0.2)]", dot: "bg-pn-green", label: "Healthy", desc: "Node available, responding within timeout threshold" },
            { cls: "text-[#7A6020] bg-[rgba(195,150,40,0.1)] border-[rgba(195,150,40,0.2)]", dot: "bg-[#B87E20]", label: "Degraded", desc: "Node running but response >500ms or replication lag detected" },
            { cls: "text-pn-red bg-[rgba(180,60,60,0.1)] border-[rgba(180,60,60,0.2)]", dot: "bg-[#C0392B]", label: "Unreachable", desc: "Node is down and excluded from connection pool" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <span className={`inline-flex items-center justify-center gap-[5px] w-[120px] shrink-0 text-[0.7rem] font-bold uppercase px-[11px] py-[4px] rounded-full border ${s.cls}`}>
                <span className={`w-[6px] h-[6px] rounded-full ${s.dot}`} />{s.label}
              </span>
              <span className="text-[0.8rem] text-pn-muted">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
