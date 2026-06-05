const tags = ["Design Tokens", "Components", "Accessibility", "Figma", "Style Dictionary", "Theming", "Governance"];

export function PublicSidebar() {
  return (
    <aside className="flex flex-col gap-[14px] max-md:hidden">
      <div className="bg-pn-white border border-pn-border rounded-[20px] p-5">
        <div className="font-['Cormorant_Garamond',serif] text-[1rem] font-semibold text-pn-navy mb-[14px]">Community Stats</div>
        {[
          { label: "Members", value: "2,341" },
          { label: "Posts", value: "1,048" },
          { label: "New this month", value: "+127", color: "#2C7A4B" },
          { label: "Moderators", value: "3" },
          { label: "Founded", value: "Nov 2023" },
        ].map((s) => (
          <div key={s.label} className="flex justify-between text-[0.83rem] py-[7px] border-b border-pn-surface last:border-b-0 last:pb-0">
            <span className="text-pn-muted">{s.label}</span>
            <span className="font-semibold text-pn-navy" style={s.color ? { color: s.color } : undefined}>{s.value}</span>
          </div>
        ))}
      </div>
      <div className="bg-pn-white border border-pn-border rounded-[20px] p-5">
        <div className="font-['Cormorant_Garamond',serif] text-[1rem] font-semibold text-pn-navy mb-[14px]">Active Tags</div>
        <div className="flex flex-wrap gap-[7px]">
          {tags.map((t) => (
            <span key={t} className="text-[0.75rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.15)] px-[11px] py-[4px] rounded-full">{t}</span>
          ))}
        </div>
      </div>
      <div className="bg-pn-steel border border-pn-steel rounded-[20px] p-5 text-center">
        <p className="text-[0.78rem] font-semibold text-[rgba(156,213,255,0.8)] uppercase tracking-[0.1em] mb-[10px]">Join this community</p>
        <p className="font-['Cormorant_Garamond',serif] text-[1.2rem] font-semibold text-white mb-[18px]">Read and contribute to 1,048 posts</p>
        <a href="/register" className="block bg-pn-surface text-pn-steel font-bold text-[0.875rem] py-[11px] rounded-[10px] text-center transition-colors hover:bg-white">Sign Up Free →</a>
      </div>
    </aside>
  );
}
