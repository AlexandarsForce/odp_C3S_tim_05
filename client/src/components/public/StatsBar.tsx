export function StatsBar() {
  const stats = [
    { value: "12,400+", label: "Active Professionals" },
    { value: "840+", label: "Communities" },
    { value: "95,000+", label: "Posts Shared" },
    { value: "180+", label: "Industries" },
  ];
  return (
    <div className="bg-pn-steel py-6">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-2 text-center">
          {stats.map((s) => (
            <div key={s.label} className="p-2">
              <div className="font-['Cormorant_Garamond',serif] text-[2rem] font-bold text-pn-pale leading-[1.1]">{s.value}</div>
              <div className="text-[0.78rem] text-[rgba(156,213,255,0.7)] mt-1 font-medium">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
