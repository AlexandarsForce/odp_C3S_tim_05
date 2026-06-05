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

export default function UserDashboard() {
  const { user } = useAuth();
  const myCommunities: CommunityPreview[] = [];
  const stats = { posts: 0, communities: 0 };

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[1000px] mx-auto px-6 py-10 pb-20">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-pn-white border border-pn-border rounded-full px-4 py-[6px] text-[0.75rem] font-semibold text-pn-steel uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-pn-sky" />
            Dashboard
          </div>
          <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3.5vw,2.4rem)] font-bold text-pn-navy">
            Welcome, {user?.username ?? "User"}
          </h1>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-10">
          {[
            { lbl: "Posts", val: stats.posts, color: "text-pn-steel" },
            { lbl: "Communities", val: stats.communities || myCommunities.length, color: "text-pn-sky" },
          ].map((s) => (
            <div key={s.lbl}
              className="bg-pn-white border border-pn-border rounded-2xl p-5 shadow-[0_6px_18px_rgba(53,88,114,0.05)]">
              <p className="text-[0.72rem] font-semibold text-pn-lm uppercase tracking-wider mb-2">{s.lbl}</p>
              <p className={`text-[2rem] font-bold tracking-tight ${s.color}`}>{s.val}</p>
            </div>
          ))}
        </div>

        <div className="max-w-[520px] mx-auto">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy">My Communities</h2>
              <Link to="/my-communities" className="text-[0.82rem] font-semibold text-pn-steel">View all →</Link>
            </div>
            {myCommunities.length > 0 ? (
              myCommunities.slice(0, 4).map((c, i) => (
                <Link key={c.id} to={`/community/${c.id}`}
                  className="flex items-center gap-3 bg-pn-white border border-pn-border rounded-[16px] p-4 mb-3 hover:shadow-[0_4px_14px_rgba(53,88,114,0.07)] transition-all">
                  <div className={`w-10 h-10 rounded-[10px] bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[1rem] font-bold text-white shrink-0`}>
                    {c.name?.charAt(0) ?? "C"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.9rem] font-semibold text-pn-navy truncate">{c.name}</div>
                    <div className="text-[0.75rem] text-pn-lm">{c.type === "private" ? "Private" : "Public"} Community</div>
                  </div>
                  <span className="text-[0.8rem] text-pn-steel font-semibold">→</span>
                </Link>
              ))
            ) : (
              <div className="text-center py-10 text-pn-muted text-sm bg-pn-white border border-pn-border rounded-[16px]">
                <p className="mb-3">You haven't joined any communities yet.</p>
                <Link to="/explore"
                  className="inline-block bg-pn-steel text-white font-semibold text-[0.85rem] px-5 py-2 rounded-lg shadow-[0_4px_12px_rgba(53,88,114,0.2)]">
                  Explore Communities
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
