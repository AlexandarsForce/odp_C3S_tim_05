export function PageHeaderPill({
  label,
  dotClass,
  textClass,
  className = "mb-5",
}: {
  label: string;
  dotClass: string;
  textClass: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-[10px] bg-pn-white border border-pn-border rounded-full pl-[14px] pr-[18px] py-[7px] shadow-[0_1px_2px_rgba(26,39,51,0.04)] select-none ${className}`}
    >
      <span className={`h-[10px] w-[10px] rounded-full ${dotClass} shrink-0`} />
      <span
        className={`font-['DM_Sans',sans-serif] text-[0.72rem] font-bold tracking-[0.12em] uppercase ${textClass}`}
      >
        {label}
      </span>
    </div>
  );
}
