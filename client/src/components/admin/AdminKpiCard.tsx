import type { LucideIcon } from "lucide-react";

/**
 * AdminKpiCard — premium KPI card for admin pages.
 *
 * Effects:
 *  - Left vertical gradient accent bar (categorical color)
 *  - Soft animated "pulse" halo behind the icon (themed for PulseNet)
 *  - Subtle radial gradient in the top-right corner for depth
 *  - Hover lift via shadow transition
 */
export function AdminKpiCard({
  Icon,
  label,
  value,
  accentHex,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  accentHex: string;
}) {
  return (
    <div className="group relative bg-pn-white border border-pn-border rounded-2xl pl-6 pr-7 py-5 mb-7 overflow-hidden shadow-[0_2px_8px_rgba(26,39,51,0.04)] hover:shadow-[0_8px_24px_rgba(26,39,51,0.08)] transition-shadow duration-300 w-fit min-w-[240px]">
      {/* Left gradient accent bar */}
      <div
        className="absolute top-0 left-0 bottom-0 w-[4px]"
        style={{
          background: `linear-gradient(180deg, ${accentHex} 0%, ${accentHex}66 100%)`,
        }}
      />

      {/* Corner radial gradient — adds depth without noise */}
      <div
        className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full"
        style={{
          background: `radial-gradient(circle, ${accentHex} 0%, transparent 70%)`,
          opacity: 0.1,
        }}
      />

      <div className="relative flex items-center gap-4">
        {/* Icon with pulsing halo */}
        <div className="relative flex h-12 w-12 items-center justify-center shrink-0">
          {/* Halo: soft pulse animation (PulseNet themed) */}
          <span
            className="absolute inset-[-4px] rounded-2xl animate-pulse"
            style={{ background: `${accentHex}22` }}
          />
          {/* Icon box */}
          <div
            className="relative flex h-full w-full items-center justify-center rounded-xl border"
            style={{
              background: `${accentHex}1f`,
              borderColor: `${accentHex}33`,
            }}
          >
            <Icon className="h-[20px] w-[20px]" style={{ color: accentHex }} />
          </div>
        </div>

        {/* Text block */}
        <div>
          <div
            className="font-['DM_Sans',sans-serif] text-[0.68rem] font-bold tracking-[0.14em] uppercase mb-[6px]"
            style={{ color: accentHex }}
          >
            {label}
          </div>
          <div className="font-['DM_Sans',sans-serif] text-[1.85rem] font-bold text-pn-navy leading-none tabular-nums">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}
