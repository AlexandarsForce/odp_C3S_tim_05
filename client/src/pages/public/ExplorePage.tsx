import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { CommunityDto } from "../../types/community/CommunityTypes";

const GRADIENTS = [
  "from-pn-sky to-pn-steel",
  "from-pn-steel to-pn-navy",
  "from-pn-pale to-pn-sky",
  "from-pn-lm to-pn-steel",
  "from-pn-steel to-pn-sky",
  "from-pn-navy to-pn-steel",
];

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [allCommunities, setAllCommunities] = useState<CommunityDto[]>([]);
  const [myIds, setMyIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    communityApi.getAll(1, 50).then((r) => {
      if (r.success && r.data) setAllCommunities(r.data.items);
    });
    if (isAuthenticated) {
      communityApi.getMine(1, 100).then((r) => {
        if (r.success && r.data) setMyIds(new Set(r.data.items.map((c) => c.id)));
      });
    }
  }, [isAuthenticated]);

  const notJoined = allCommunities.filter((c) => !myIds.has(c.id));

  const filtered = (search
    ? allCommunities.filter(
        (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
      )
    : notJoined
  );

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <nav className="sticky top-0 z-100 bg-[rgba(247,248,240,0.92)] backdrop-blur-[12px] border-b border-pn-border px-6">
        <div className="max-w-[1120px] mx-auto h-[60px] flex items-center justify-between">
          <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-steel">
            Pulse<span className="text-pn-sky">Net</span>
          </Link>
          <div className="flex gap-2 items-center">
            <Link to="/my-communities" className="text-[0.875rem] font-medium text-pn-muted px-3 py-[6px] rounded-lg hover:text-pn-steel">My Communities</Link>
            <Link to="/feed" className="text-[0.875rem] font-medium text-pn-muted px-3 py-[6px] rounded-lg hover:text-pn-steel">Feed</Link>
            <Link to="/profile/me" className="text-[0.875rem] font-semibold text-white bg-pn-steel px-[18px] py-[8px] rounded-lg">My Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 py-10 pb-20">
        <div className="mb-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(2rem,4vw,2.6rem)] font-bold text-pn-navy leading-[1.1]">
              Explore Communities
            </h1>
            <div className="flex gap-3 shrink-0">
              <Link to="/my-communities"
                className="inline-flex items-center justify-center bg-pn-white text-pn-steel font-semibold text-[0.92rem] px-5 py-[10px] rounded-xl border border-pn-border hover:border-pn-sky transition-all whitespace-nowrap">
                My Communities
              </Link>
              <Link to="/community/create"
                className="inline-flex items-center justify-center bg-pn-steel text-white font-semibold text-[0.92rem] px-5 py-[10px] rounded-xl shadow-[0_8px_20px_rgba(53,88,114,0.2)] hover:bg-[#2a4760] transition-all whitespace-nowrap">
                + Create
              </Link>
            </div>
          </div>
          <p className="text-[1rem] leading-[1.7] text-pn-muted max-w-[560px]">
            Find professional spaces built around skills, industries, and focused collaboration.
          </p>
        </div>

        <div className="relative mb-5">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-pn-lm pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-pn-white border border-pn-border rounded-xl text-[0.92rem] text-pn-navy outline-none focus:border-pn-sky transition-colors"
            placeholder="Search communities by name or topic..." />
        </div>

        {filtered.length > 0 && (
          <div className="text-[0.82rem] font-semibold text-pn-muted mb-4">
            {search ? `Search results · ${filtered.length}` : `Communities to discover · ${filtered.length}`}
          </div>
        )}

        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
          {filtered.map((c, i) => (
            <div key={c.id}
              className="bg-pn-white border border-pn-border rounded-[28px] p-6 shadow-[0_10px_30px_rgba(53,88,114,0.05)] flex flex-col">
              <div className="flex gap-[14px] mb-6">
                <div className={`w-16 h-16 rounded-[16px] shrink-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[1.4rem] font-bold text-white`}>
                  {c.name?.charAt(0)?.toUpperCase() ?? "C"}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-navy truncate leading-tight">{c.name}</div>
                  <div className="text-[0.78rem] text-pn-lm font-medium mt-1">
                    {c.memberCount.toLocaleString()} {c.memberCount === 1 ? "member" : "members"}
                  </div>
                </div>
              </div>
              <p className="text-[0.875rem] leading-[1.7] text-pn-muted mb-6 flex-1">{c.description || "No description."}</p>
              <div className="flex items-center justify-between pt-[14px] border-t border-pn-bg">
                <div className="flex items-center gap-[6px]">
                  <span className="text-[0.72rem] font-medium text-pn-lm bg-pn-bg px-[10px] py-[3px] rounded-md">
                    {c.type === "private" ? "Private" : "Public"}
                  </span>
                  {myIds.has(c.id) && (
                    <span className="text-[0.72rem] font-medium text-pn-green bg-[rgba(46,139,87,0.08)] px-[10px] py-[3px] rounded-md">
                      Joined
                    </span>
                  )}
                </div>
                <Link to={`/community/${c.id}`}
                  className="group inline-flex items-center gap-[6px] text-[0.85rem] font-semibold text-[#355872] hover:text-[#2a4760] transition-colors">
                  View
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-pn-white border border-pn-border rounded-2xl px-7 py-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-[rgba(122,170,206,0.14)] flex items-center justify-center text-pn-steel mx-auto mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16.5" y2="16.5" />
                </svg>
              </div>
              <p className="font-['Cormorant_Garamond',serif] text-[1.4rem] font-semibold text-pn-navy mb-2">
                {search ? "No matches yet" : "You're in every circle"}
              </p>
              <p className="text-[0.9rem] text-pn-muted mb-5 max-w-[400px] mx-auto leading-[1.6]">
                {search
                  ? <>Nothing matches "<strong className="text-pn-navy font-semibold">{search}</strong>" — try a broader keyword or a topic name.</>
                  : "You've joined every public community on PulseNet. Start a new one to expand the network."}
              </p>
              {!search && (
                <Link to="/community/create"
                  className="inline-block bg-pn-steel text-white font-semibold text-[0.88rem] px-6 py-[10px] rounded-xl shadow-[0_6px_16px_rgba(53,88,114,0.2)] hover:bg-[#2a4760] transition-colors">
                  + Create a community
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
