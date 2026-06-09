import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { Footer } from "../../components/layout/Footer";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ posts: 0, communities: 0 });
  const greeting = getGreeting();
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      usersApi.getUserPosts(user.id, 1, 1),
      communityApi.getMine(1, 1),
    ]).then(([postsRes, commRes]) => {
      setStats({
        posts: postsRes.data?.total ?? 0,
        communities: commRes.data?.total ?? 0,
      });
    });
  }, [user?.id]);

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

        <div className="grid grid-cols-2 gap-4">
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
              val: stats.communities,
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

      </main>

      <Footer />
    </div>
  );
}
