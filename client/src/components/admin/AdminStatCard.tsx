import { TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function AdminStatCard({
  label,
  value,
  delta,
  deltaUp = true,
  Icon,
  iconBgClass,
  iconColorClass,
  labelColorClass,
  glowColor,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaUp?: boolean;
  Icon?: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  labelColorClass?: string;
  glowColor?: string;
}) {
  return (
    <div className="relative p-6 rounded-xl border border-pn-border bg-pn-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {/* Corner radial glow */}
      {glowColor && (
        <div
          className="pointer-events-none absolute -top-6 -right-6 w-32 h-32 rounded-full"
          style={{ background: glowColor, opacity: 0.18, filter: "blur(18px)" }}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        {Icon && iconBgClass && iconColorClass ? (
          <div className={`p-2 rounded-lg ${iconBgClass}`}>
            <Icon className={`h-5 w-5 ${iconColorClass}`} />
          </div>
        ) : (
          <div />
        )}
        <TrendingUp className="h-4 w-4 text-pn-green" />
      </div>
      <div className={`text-[0.78rem] font-bold mb-1 ${labelColorClass ?? "text-pn-lm"}`}>{label}</div>
      <div className="font-['DM_Sans',sans-serif] text-2xl font-bold text-pn-navy tabular-nums">
        {value}
      </div>
      {delta && (
        <p className={`text-sm mt-1 ${deltaUp ? "text-pn-green" : "text-pn-red"}`}>
          {deltaUp ? "↑" : "↓"} {delta}
        </p>
      )}
    </div>
  );
}

function LogIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function ActivityRow({
  text,
  actor,
  target,
  time,
}: {
  icon?: string;
  text: string;
  actor: string;
  target: string;
  time: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(53,88,114,0.03)] transition-colors cursor-default">
      <div className="p-2 rounded-lg bg-[rgba(212,119,6,0.1)] text-[#d97706] shrink-0">
        <LogIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[0.85rem] font-medium text-pn-navy truncate">
          <span className="text-pn-steel">{actor}</span> {text}
        </p>
        {target && <p className="text-xs text-pn-lm truncate mt-[1px]">{target}</p>}
      </div>
      <div className="text-xs text-pn-lm shrink-0 ml-2">{time}</div>
    </div>
  );
}
