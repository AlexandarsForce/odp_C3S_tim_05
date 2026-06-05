import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";

type CommunityPreview = {
  id: number;
  name: string;
  type?: "public" | "private";
};

const GRADIENTS = [
  "from-pn-sky to-pn-steel",
  "from-pn-steel to-pn-navy",
  "from-pn-pale to-pn-sky",
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const myCommunities: CommunityPreview[] = [];
  const stats = { posts: 0, communities: 0 };
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[1000px] mx-auto px-6 py-10 pb-20">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[0.78rem] font-semibold text-pn-muted uppercase tracking-wider mb-3">
            <span className="w-[6px] h-[6px] rounded-full bg-pn-sky animate-pulse-dot" />
            {greeting} · {today}
          </div>
          <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(2rem,4vw,2.6rem)] font-bold text-pn-navy leading-[1.1]">
            Welcome, {user?.username ?? "User"}
          </h1>
          <p className="text-[1rem] text-pn-muted mt-2">Here's a quick pulse of your network.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-9">
          {[
            {
              lbl: "Posts",
              val: stats.posts,
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                  <line x1="9" y1="17" x2="13" y2="17" />
                </svg>
              ),
            },
            {
              lbl: "Communities",
              val: stats.communities || myCommunities.length,
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
            },
          ].map((s) => (
            <div key={s.lbl}
              className="bg-pn-white border border-pn-border rounded-2xl px-5 py-[18px] shadow-[0_6px_18px_rgba(53,88,114,0.05)] flex items-center justify-between">
              <div>
                <p className="text-[0.74rem] font-semibold text-pn-muted uppercase tracking-wider mb-[2px]">{s.lbl}</p>
                <p className="text-[1.9rem] font-bold tracking-tight text-pn-navy leading-none">{s.val}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[rgba(122,170,206,0.14)] flex items-center justify-center text-pn-steel shrink-0">
                {s.icon}
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy">My Communities</h2>
            <Link to="/my-communities" className="text-[0.82rem] font-semibold text-pn-steel hover:text-[#2a4760] transition-colors">View all →</Link>
          </div>
          {myCommunities.length > 0 ? (
            <div className="space-y-3">
              {myCommunities.slice(0, 4).map((c, i) => (
                <Link key={c.id} to={`/community/${c.id}`}
                  className="flex items-center gap-3 bg-pn-white border border-pn-border rounded-[16px] p-4 hover:shadow-[0_4px_14px_rgba(53,88,114,0.07)] hover:border-pn-sky transition-all">
                  <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[1rem] font-bold text-white shrink-0`}>
                    {c.name?.charAt(0) ?? "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.9rem] font-semibold text-pn-navy truncate">{c.name}</div>
                    <div className="text-[0.75rem] text-pn-lm">{c.type === "private" ? "Private" : "Public"} Community</div>
                  </div>
                  <span className="text-[0.8rem] text-pn-steel font-semibold">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-pn-white border border-pn-border rounded-2xl px-7 py-9 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(122,170,206,0.14)] flex items-center justify-center text-pn-steel mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-navy mb-2">Join your first circle</p>
              <p className="text-[0.9rem] text-pn-muted mb-5 max-w-[360px] mx-auto leading-[1.6]">
                Browse public communities and join the ones that fit your skills, industry, or curiosity.
              </p>
              <Link to="/explore"
                className="inline-block bg-pn-steel text-white font-semibold text-[0.88rem] px-6 py-[10px] rounded-xl shadow-[0_6px_16px_rgba(53,88,114,0.2)] hover:bg-[#2a4760] transition-colors">
                Explore Communities
              </Link>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
