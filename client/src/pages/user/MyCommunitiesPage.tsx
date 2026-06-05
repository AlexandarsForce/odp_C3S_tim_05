import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { Footer } from "../../components/layout/Footer";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import type { CommunityDto } from "../../types/community/CommunityTypes";

const GRADIENTS = [
  "from-pn-sky to-pn-steel",
  "from-pn-steel to-pn-navy",
  "from-pn-pale to-pn-sky",
  "from-pn-lm to-pn-steel",
];

export default function MyCommunitiesPage() {
  const [communities, setCommunities] = useState<CommunityDto[]>([]);

  useEffect(() => {
    communityApi.getMine().then((r) => {
      if (r.success && r.data) setCommunities(r.data.items);
    });
  }, []);

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />
      <main className="max-w-[1120px] mx-auto px-6 py-10 pb-20">
        <div className="mb-9">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <h1 className="inline-flex items-center gap-2 bg-pn-white border border-pn-border rounded-full px-4 py-[6px] text-[0.75rem] font-semibold text-pn-steel uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-pn-sky" />
              My Communities
            </h1>
            <Link to="/community/create"
              className="inline-flex items-center gap-2 bg-pn-steel text-white font-semibold text-[0.95rem] px-7 py-[14px] rounded-xl shadow-[0_10px_28px_rgba(53,88,114,0.22)] hover:bg-[#2a4760] transition-all whitespace-nowrap">
              + Create Community
            </Link>
          </div>
          <p className="text-[1.05rem] leading-[1.75] text-pn-muted max-w-[640px]">
            All the professional spaces you've joined or created.
          </p>
        </div>

        <div className={`grid gap-5 ${communities.length === 0 ? "grid-cols-1 max-w-[520px]" : "grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"}`}>
          {communities.map((c, i) => (
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
                <span className="text-[0.72rem] font-medium text-pn-lm bg-pn-bg px-[10px] py-[3px] rounded-md">
                  {c.type === "private" ? "Private" : "Public"}
                </span>
                <Link to={`/community/${c.id}`}
                  className="group inline-flex items-center gap-[6px] text-[0.85rem] font-semibold text-[#355872] hover:text-[#2a4760] transition-colors">
                  View
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          ))}

          <Link
            to="/explore"
            className="group relative overflow-hidden rounded-[28px] border-2 border-dashed border-[rgba(122,170,206,0.5)] bg-[rgba(122,170,206,0.05)] p-6 flex flex-col hover:border-pn-sky hover:bg-[rgba(122,170,206,0.09)] transition-colors min-h-[260px]"
          >
            <div className="flex gap-[14px] mb-6">
              <div className="w-16 h-16 rounded-[16px] shrink-0 bg-pn-white border border-pn-border flex items-center justify-center text-pn-steel group-hover:bg-pn-sky group-hover:text-white group-hover:border-pn-sky transition-colors">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <line x1="20" y1="20" x2="16.5" y2="16.5" />
                </svg>
              </div>
              <div className="min-w-0 flex flex-col justify-center">
                <div className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-navy leading-tight">
                  {communities.length === 0 ? "Find your first circle" : "Discover more"}
                </div>
                <div className="text-[0.78rem] text-pn-lm font-medium mt-1">
                  Browse the network
                </div>
              </div>
            </div>
            <p className="text-[0.875rem] leading-[1.7] text-pn-muted mb-6 flex-1">
              {communities.length === 0
                ? "You haven't joined any communities yet. Explore public spaces and join the ones that fit."
                : "Search public communities by topic, skill, or industry — there's always another circle to step into."}
            </p>
            <div className="flex items-center justify-between pt-[14px] border-t border-[rgba(122,170,206,0.25)]">
              <span className="text-[0.72rem] font-medium text-pn-steel bg-pn-white border border-pn-border px-[10px] py-[3px] rounded-md">
                Explore
              </span>
              <span className="inline-flex items-center gap-[6px] text-[0.85rem] font-semibold text-pn-steel group-hover:text-[#2a4760] transition-colors">
                Browse all
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </span>
            </div>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
