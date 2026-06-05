import { Link } from "react-router-dom";

export function HeroSection() {
  return (
    <section className="py-[clamp(60px,8vw,100px)] overflow-hidden">
      <div className="max-w-[1120px] mx-auto px-6">
        <div className="flex items-center justify-between gap-12 max-md:flex-col">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-pn-white border border-pn-border rounded-full px-4 py-[6px] text-[0.78rem] font-semibold text-pn-steel uppercase tracking-[0.04em] shadow-[0_1px_4px_rgba(53,88,114,0.07)] mb-7 animate-fade-up">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky animate-pulse-dot" />
              Professional Networking Platform
            </div>
            <h1 className="font-['Cormorant_Garamond',Georgia,serif] text-[clamp(2.6rem,6vw,4.4rem)] font-bold leading-[1.1] tracking-[-0.02em] text-pn-navy mb-[22px] animate-fade-up-1">
              Connecting the <span className="text-pn-steel">Pulse</span> of<br />
              <span className="text-transparent [-webkit-text-stroke:1.5px_#355872]">Professional</span> Communities
            </h1>
            <p className="text-[1.05rem] leading-[1.7] text-pn-muted max-w-[520px] mb-4 animate-fade-up-2">
              Build meaningful networks, join themed communities aligned with your expertise, and engage in real-time conversations that move your career forward.
            </p>
            <div className="inline-flex items-center gap-[6px] text-[0.8rem] text-pn-lm font-medium mb-8 animate-fade-up-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8FABD4" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              News Feed &amp; Communities require a free account
            </div>
            <div className="flex gap-3 flex-wrap mb-10 animate-fade-up-3">
              <Link to="/register" className="inline-flex items-center gap-2 bg-pn-steel text-white font-semibold text-[0.95rem] px-7 py-[13px] rounded-xl shadow-[0_4px_16px_rgba(53,88,114,0.22)] hover:bg-[#2a4760] hover:shadow-[0_8px_24px_rgba(53,88,114,0.32)] hover:-translate-y-[1px] transition-all">
                Join PulseNet — Free
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 bg-pn-white text-pn-steel font-medium text-[0.95rem] px-7 py-[13px] rounded-xl border-[1.5px] border-pn-border hover:border-pn-sky hover:-translate-y-[1px] transition-all">
                Log In
              </Link>
            </div>
            <div className="flex items-center gap-3 animate-fade-up-4">
              <div className="flex">
                {["#7AAACE,#355872","#355872,#1A2733","#9CD5FF,#7AAACE","#8FABD4,#355872"].map((g, i) => (
                  <div key={i} className={`w-[30px] h-[30px] rounded-full border-2 border-pn-bg ${i > 0 ? "-ml-2" : ""}`}
                    style={{ background: `linear-gradient(135deg,${g})` }} />
                ))}
              </div>
              <span className="text-[0.82rem] text-pn-lm font-medium">
                Join <strong className="text-pn-steel">12,400+</strong> professionals already connected
              </span>
            </div>
          </div>
          <div className="relative w-full max-w-[480px] flex-[0_0_auto] animate-fade-up max-md:max-w-full">
            <div className="absolute -top-[18px] -right-6 bg-pn-white rounded-xl border border-pn-border px-[14px] py-[10px] shadow-[0_8px_24px_rgba(53,88,114,0.12)] text-[0.78rem] whitespace-nowrap flex items-center gap-[10px] max-md:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div className="text-[0.72rem] font-semibold text-pn-navy">3 new connections</div>
                <div className="text-[0.68rem] text-pn-lm">Today</div>
              </div>
            </div>
            <div className="bg-pn-white rounded-[18px] border border-pn-border shadow-[0_16px_64px_rgba(53,88,114,0.12),0_2px_8px_rgba(53,88,114,0.06)] overflow-hidden p-5">
              <div className="flex items-center justify-between mb-[18px] pb-[14px] border-b border-pn-surface">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pn-steel to-pn-sky flex items-center justify-center">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"><path d="M2 12h3l3-7 4 14 3-9 2 2h5"/></svg>
                  </div>
                  <span className="text-[0.82rem] font-bold text-pn-steel font-['Cormorant_Garamond',serif]">PulseNet</span>
                </div>
                <div className="flex gap-[6px]">
                  {["bg-pn-steel","bg-pn-sky","bg-pn-pale"].map((c, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${c}`} />
                  ))}
                </div>
              </div>
              {[
                { avatar: "from-pn-sky to-pn-steel", lines: ["w-[90px]","w-[60px]"], tag1: "❤ 48", tag2: "💬 12", hasImage: true },
                { avatar: "from-pn-pale to-pn-lm", lines: ["w-[70px]","w-[50px]"], tag1: "❤ 124", tag2: "💬 31", tag3: "↗ 8", hasImage: false },
              ].map((post, i) => (
                <div key={i} className="py-[14px] border-b border-pn-surface last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-[10px] mb-[10px]">
                    <div className={`w-[34px] h-[34px] rounded-full bg-gradient-to-br ${post.avatar} shrink-0`} />
                    <div className="flex-1">
                      <div className={`h-2 rounded bg-pn-border ${post.lines[0]} mb-1`} />
                      <div className={`h-[6px] rounded bg-pn-border opacity-50 ${post.lines[1]}`} />
                    </div>
                  </div>
                  <div className="h-2 rounded bg-pn-border w-full mb-[6px]" />
                  <div className="h-2 rounded bg-pn-border w-4/5" />
                  {post.hasImage && (
                    <div className="w-full h-[110px] rounded-[10px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] mt-[10px] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7AAACE" strokeWidth="1.5" opacity="0.5">
                        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex gap-2 mt-[10px]">
                    <span className="text-[0.7rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[3px] rounded-full">{post.tag1}</span>
                    <span className="text-[0.7rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[3px] rounded-full">{post.tag2}</span>
                    {"tag3" in post && <span className="text-[0.7rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[3px] rounded-full">{post.tag3}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute -bottom-[14px] -left-7 bg-pn-white rounded-xl border border-pn-border px-[14px] py-[10px] shadow-[0_8px_24px_rgba(53,88,114,0.12)] text-[0.78rem] whitespace-nowrap flex items-center gap-[10px] max-md:hidden">
              <div className="w-8 h-8 rounded-lg bg-pn-surface flex items-center justify-center shrink-0 text-[14px]">🏛️</div>
              <div>
                <div className="text-[0.72rem] font-semibold text-pn-navy">Design Systems</div>
                <div className="text-[0.68rem] text-pn-lm">2,341 members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
