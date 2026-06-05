import { Link } from "react-router-dom";

const CommunityIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#355872" strokeWidth="1.75">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const NetworkIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#355872" strokeWidth="1.75">
    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </svg>
);
const ChatIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#355872" strokeWidth="1.75">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const features = [
  {
    Icon: CommunityIcon,
    title: "Themed Communities",
    body: "Find your tribe. Join niche groups built around your skills, industry, or interests. Every community has its own feed, members, and discussions — your curated corner of the network.",
    tags: ["Design Systems", "ML Engineering", "Startups", "DevOps"],
    link: "Browse communities →",
  },
  {
    Icon: NetworkIcon,
    title: "Meaningful Connections",
    body: "Follow peers, industry leaders, and rising voices in your field. Build a network that actually reflects your professional world — not algorithmic noise.",
    list: ["👤 Follow professionals", "🔍 Discover by industry", "⭐ Build your reputation"],
    link: "Start connecting →",
  },
  {
    Icon: ChatIcon,
    title: "Real-Time Communication",
    body: "Post updates, comment on discussions, and like what resonates. An interactive feed that keeps you plugged into your professional community in real time.",
    miniFeed: true,
    link: "Join the conversation →",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-[clamp(64px,8vw,100px)]">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="text-center mb-[52px]">
          <p className="text-[0.78rem] font-semibold uppercase tracking-[0.1em] text-pn-sky mb-[10px]">Why PulseNet</p>
          <h2 className="font-['Cormorant_Garamond',Georgia,serif] text-[clamp(1.8rem,3.5vw,2.6rem)] font-bold text-pn-navy mb-[14px] tracking-[-0.01em]">
            Everything you need to grow<br />your professional network
          </h2>
          <p className="text-[1rem] text-pn-muted max-w-[480px] mx-auto leading-[1.65]">
            A clean, distraction-free platform built for meaningful professional connections — not noise.
          </p>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
          {features.map((f, i) => (
            <div key={i} className="bg-pn-white border border-pn-border rounded-[16px] p-8 relative overflow-hidden group hover:shadow-[0_8px_32px_rgba(53,88,114,0.1)] hover:-translate-y-[3px] hover:border-pn-lm transition-all">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-pn-steel to-pn-sky scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              <div className="w-12 h-12 rounded-xl bg-[rgba(53,88,114,0.07)] flex items-center justify-center mb-[18px] group-hover:bg-[rgba(53,88,114,0.13)] transition-colors">
                <f.Icon />
              </div>
              <h3 className="font-['Cormorant_Garamond',Georgia,serif] text-[1.3rem] font-semibold text-pn-navy mb-[10px]">{f.title}</h3>
              <p className="text-[0.88rem] leading-[1.65] text-pn-muted">{f.body}</p>
              {"tags" in f && f.tags && (
                <div className="mt-5 p-3 bg-pn-surface rounded-[10px] flex gap-[6px] flex-wrap">
                  {f.tags.map((t) => (
                    <span key={t} className="text-[0.75rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[4px] rounded-full">{t}</span>
                  ))}
                </div>
              )}
              {"list" in f && f.list && (
                <div className="mt-5 flex flex-col gap-2">
                  {f.list.map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[0.83rem] text-pn-muted">{item}</div>
                  ))}
                </div>
              )}
              {"miniFeed" in f && f.miniFeed && (
                <div className="mt-5 p-[14px] bg-pn-surface rounded-[10px]">
                  <div className="flex gap-2 items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pn-sky to-pn-steel shrink-0" />
                    <div className="h-2 rounded bg-pn-border flex-1" />
                  </div>
                  <div className="h-[6px] rounded bg-pn-border w-[85%] ml-8 mb-[5px]" />
                  <div className="h-[6px] rounded bg-pn-border w-[60%] ml-8" />
                </div>
              )}
              <Link to="/register" className="inline-flex items-center gap-1 text-[0.82rem] font-semibold text-pn-steel mt-4 hover:gap-2 transition-all">{f.link}</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
