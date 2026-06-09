import type { ReactNode } from "react";

export function AdminTable({ columns, children }: { columns: string[]; children: ReactNode }) {
  return (
    <div className="bg-pn-white border border-pn-border rounded-[20px] overflow-hidden">
      <table className="w-full border-collapse text-[0.875rem]">
        <thead>
          <tr className="border-b border-pn-border">
            {columns.map((c) => (
              <th key={c} className="text-left px-4 py-3 text-[0.72rem] font-bold tracking-[0.09em] uppercase text-pn-lm">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function AdminPagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return <></>;
  const range: (number | string)[] = [];
  for (let i = 1; i <= Math.min(totalPages, 5); i++) range.push(i);
  if (totalPages > 5) { range.push("…"); range.push(totalPages); }

  return (
    <div className="flex items-center justify-between px-5 py-4 border-t border-pn-surface flex-wrap gap-[10px]">
      <span className="text-[0.8rem] text-pn-lm">Showing {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} of {total.toLocaleString()} entries</span>
      <div className="flex gap-1">
        <button onClick={() => onChange(page - 1)} disabled={page <= 1}
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold text-pn-muted bg-pn-white border border-pn-border hover:border-pn-sky hover:text-pn-steel disabled:opacity-30 transition-colors cursor-pointer">‹</button>
        {range.map((p, i) =>
          typeof p === "string" ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[0.8rem] text-pn-lm">…</span>
          ) : (
            <button key={p} onClick={() => onChange(p)}
              className={`w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold transition-colors cursor-pointer ${
                p === page ? "bg-pn-steel text-white border-pn-steel" : "text-pn-muted bg-pn-white border border-pn-border hover:border-pn-sky hover:text-pn-steel"
              }`}>{p}</button>
          )
        )}
        <button onClick={() => onChange(page + 1)} disabled={page >= totalPages}
          className="w-8 h-8 rounded-[7px] flex items-center justify-center text-[0.8rem] font-semibold text-pn-muted bg-pn-white border border-pn-border hover:border-pn-sky hover:text-pn-steel disabled:opacity-30 transition-colors cursor-pointer">›</button>
      </div>
    </div>
  );
}
