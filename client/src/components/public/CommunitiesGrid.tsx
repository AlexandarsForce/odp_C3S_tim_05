import { Link } from "react-router-dom";

const communities = [
  { initial: "D", name: "Design Systems", members: "2,341", desc: "A community dedicated to building and maintaining scalable design systems across teams and products." },
  { initial: "M", name: "ML Engineering", members: "5,812", desc: "Machine learning practitioners sharing insights, papers, and real-world deployment experiences." },
  { initial: "S", name: "Startups & Founders", members: "3,190", desc: "Founders, early employees, and operators connecting around building products and companies from zero." },
  { initial: "P", name: "Product Management", members: "4,407", desc: "PMs sharing frameworks, war stories, and strategies for building products users actually love." },
  { initial: "D", name: "DevOps & Platform", members: "1,988", desc: "Engineers focused on infrastructure, CI/CD, observability, and building resilient platforms at scale." },
  { initial: "F", name: "FinTech & Finance", members: "2,650", desc: "Professionals in banking, payments, investment tech, and the future of financial infrastructure." },
];

export function CommunitiesGrid() {
  return (
    <section className="pb-[clamp(64px,8vw,100px)]">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div>
            <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-pn-sky mb-[10px]">Explore</p>
            <h2 className="font-['Cormorant_Garamond',Georgia,serif] text-[clamp(1.6rem,3vw,2.2rem)] font-bold text-pn-navy">Active Communities</h2>
          </div>
          <Link to="/register" className="text-[0.875rem] font-semibold text-pn-steel flex items-center gap-1 hover:gap-2 transition-all">
            View all communities →
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {communities.map((c) => (
            <Link key={c.name} to="/register" className="bg-pn-white border border-pn-border rounded-[14px] p-5 block hover:shadow-[0_6px_20px_rgba(53,88,114,0.09)] hover:border-pn-sky hover:-translate-y-[2px] transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[1rem] font-bold text-white shrink-0">
                  {c.initial}
                </div>
                <div className="min-w-0">
                  <div className="text-[0.95rem] font-semibold text-pn-navy truncate">{c.name}</div>
                  <div className="text-[0.75rem] text-pn-lm font-medium">{c.members} members</div>
                </div>
              </div>
              <p className="text-[0.83rem] leading-[1.6] text-pn-muted line-clamp-2">{c.desc}</p>
              <div className="mt-[14px] pt-3 border-t border-pn-surface flex items-center justify-between">
                <span className="text-[0.75rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.07)] px-[10px] py-[3px] rounded-full">Members Only Feed</span>
                <span className="text-[0.8rem] text-pn-lm">→</span>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[rgba(53,88,114,0.06)] border border-[rgba(53,88,114,0.12)] rounded-lg px-4 py-2 text-[0.82rem] font-medium text-pn-steel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#355872" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Community feeds are visible to registered members only — <Link to="/register" className="font-semibold">create a free account</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
