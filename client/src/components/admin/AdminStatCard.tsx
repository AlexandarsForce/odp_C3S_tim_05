import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function AdminStatCard({ label, value, delta, deltaUp = true }: { label: string; value: string; delta?: string; deltaUp?: boolean }) {
  return (
    <div className="bg-pn-white border border-pn-border rounded-[18px] px-[22px] py-5 hover:shadow-[0_6px_20px_rgba(53,88,114,0.08)] transition-shadow">
      <div className="text-[0.68rem] font-bold tracking-[0.1em] uppercase text-pn-lm mb-2">{label}</div>
      <div className="font-['Cormorant_Garamond',serif] text-[2rem] font-bold text-pn-navy leading-none mb-[5px]">{value}</div>
      {delta && (
        <div className="text-[0.75rem] flex items-center gap-1">
          <span className={deltaUp ? "text-pn-green font-semibold" : "text-pn-red font-semibold"}>{deltaUp ? "↑" : "↓"}</span>
          <span className="text-pn-muted">{delta}</span>
        </div>
      )}
    </div>
  );
}

export function AdminNavPanel({ icon, title, sub, to }: { icon: ReactNode; title: string; sub: string; to: string }) {
  return (
    <Link to={to} className="bg-pn-white border border-pn-border rounded-[18px] p-[22px] flex items-start gap-4 hover:shadow-[0_8px_28px_rgba(53,88,114,0.1)] hover:border-pn-sky hover:-translate-y-[2px] transition-all">
      <div className="w-11 h-11 rounded-xl bg-[rgba(53,88,114,0.08)] flex items-center justify-center text-[1.2rem] shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="font-['Cormorant_Garamond',serif] text-[1.05rem] font-semibold text-pn-navy mb-1">{title}</div>
        <div className="text-[0.78rem] text-pn-muted leading-[1.5]">{sub}</div>
      </div>
      <span className="text-[0.9rem] text-pn-lm shrink-0 mt-[2px]">→</span>
    </Link>
  );
}

export function ActivityRow({ icon, text, actor, target, time }: { icon: string; text: string; actor: string; target: string; time: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-pn-surface last:border-b-0 last:pb-0">
      <div className="w-8 h-8 rounded-[9px] bg-[rgba(53,88,114,0.08)] flex items-center justify-center text-[0.85rem] shrink-0 mt-[1px]">{icon}</div>
      <div className="flex-1">
        <div className="text-[0.85rem] text-pn-navy leading-[1.5]">
          <span className="text-pn-steel font-semibold">{actor}</span> {text} <span className="text-pn-steel font-semibold">{target}</span>
        </div>
        <div className="text-[0.72rem] text-pn-lm mt-[2px]">{time}</div>
      </div>
    </div>
  );
}
