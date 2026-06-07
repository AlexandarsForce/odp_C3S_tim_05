export function AdminToolbar({ search, onSearchChange, filters, resultCount }: {
  search: string; onSearchChange: (v: string) => void; filters?: { value: string; label: string; onChange: (v: string) => void; options: { value: string; label: string }[] }[];
  resultCount: string;
}) {
  return (
    <div className="flex items-center gap-[10px] mb-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[0.9rem] text-pn-lm">⌕</span>
        <input type="text" value={search} onChange={e => onSearchChange(e.target.value)}
          className="w-full bg-pn-white border border-pn-border rounded-[10px] py-[10px] pl-9 pr-[14px] text-[0.875rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] placeholder:text-pn-lm focus:border-pn-sky transition-colors"
          placeholder="Search..." />
      </div>
      {filters?.map((f) => (
        <select key={f.label} value={f.value} onChange={e => f.onChange(e.target.value)}
          className="bg-pn-white border border-pn-border rounded-[10px] px-[14px] py-[10px] text-[0.82rem] text-pn-navy outline-none font-['DM_Sans',sans-serif]">
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ))}
      <span className="text-[0.8rem] text-pn-lm whitespace-nowrap">{resultCount}</span>
    </div>
  );
}
