import { AdminSelect } from "./AdminSelect";

export function AdminToolbar({ search, onSearchChange, filters, resultCount }: {
  search: string; onSearchChange: (v: string) => void; filters?: { value: string; label: string; onChange: (v: string) => void; options: { value: string; label: string }[] }[];
  resultCount?: string;
}) {
  return (
    <div className="flex items-center gap-[10px] mb-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-[16px] top-1/2 -translate-y-1/2 text-pn-lm pointer-events-none select-none">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-pn-white border border-pn-border rounded-[10px] py-[10px] pl-[44px] pr-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
          placeholder="Search..." />
      </div>
      {filters?.map((f) => (
        <AdminSelect
          key={f.label}
          value={f.value}
          onChange={f.onChange}
          options={f.options}
        />
      ))}
      {resultCount && <span className="text-[0.8rem] text-pn-lm whitespace-nowrap">{resultCount}</span>}
    </div>
  );
}
