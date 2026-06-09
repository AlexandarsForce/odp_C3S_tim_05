import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { postApi } from "../../api_services/posts/PostAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { AppNavbar } from "../../components/layout/AppNavbar";
import type { PostDto, PostSortOption } from "../../types/post/PostTypes";
import type { CommunityDto } from "../../types/community/CommunityTypes";

const SORT_OPTIONS: PostSortOption[] = [
  { key: "newest", label: "Newest", sortBy: "createdAt", sortOrder: "desc" },
  { key: "top", label: "Most liked", sortBy: "likesCount", sortOrder: "desc" },
  { key: "discussed", label: "Most commented", sortBy: "commentsCount", sortOrder: "desc" },
];

const AVATARS = [
  "from-pn-sky to-pn-steel",
  "from-pn-steel to-pn-navy",
  "from-pn-pale to-pn-sky",
  "from-pn-lm to-pn-steel",
];

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function FeedPage() {
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [myCommunities, setMyCommunities] = useState<CommunityDto[]>([]);
  const [sortKey, setSortKey] = useState("newest");
  const navigate = useNavigate();

  const fetchFeed = useCallback(async () => {
    const [feedRes, commRes] = await Promise.all([
      postApi.getFeed(),
      communityApi.getMine(1, 10),
    ]);
    if (feedRes.success && feedRes.data) setPosts(feedRes.data.items);
    if (commRes.success && commRes.data) setMyCommunities(commRes.data.items);
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const displayedPosts = useMemo(() => {
    const sort = SORT_OPTIONS.find((option) => option.key === sortKey) ?? SORT_OPTIONS[0];
    return [...posts].sort((a, b) => {
      if (sort.sortBy === "likesCount") return b.likesCount - a.likesCount;
      if (sort.sortBy === "commentsCount") return b.commentsCount - a.commentsCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [posts, sortKey]);

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[1120px] mx-auto px-6 py-8 pb-20 grid grid-cols-[220px_1fr_280px] gap-6 items-start max-lg:grid-cols-[1fr_280px] max-md:grid-cols-1">
        {/* LEFT SIDEBAR */}
        <aside className="sticky top-[86px] max-lg:hidden">
          <div className="bg-gradient-to-br from-[rgba(122,170,206,0.1)] via-[rgba(156,213,255,0.06)] to-[rgba(53,88,114,0.04)] backdrop-blur-sm border border-[rgba(122,170,206,0.2)] rounded-[16px] overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(122,170,206,0.15)]">
              <div className="text-[0.78rem] font-bold text-pn-navy tracking-wide">My Communities</div>
            </div>
            <div className="divide-y divide-[rgba(122,170,206,0.1)]">
              {myCommunities.map((c, i) => (
                <Link key={c.id} to={`/community/${c.id}`}
                  className="flex items-center gap-[10px] px-4 py-[10px] text-[0.84rem] font-medium text-pn-muted hover:bg-[rgba(122,170,206,0.08)] hover:text-pn-steel transition-colors">
                  <div className={`w-[26px] h-[26px] rounded-[7px] bg-gradient-to-br ${AVATARS[i % AVATARS.length]} flex items-center justify-center text-[0.72rem] font-bold text-white shrink-0`}>
                    {c.name?.charAt(0) ?? "C"}
                  </div>
                  <span className="truncate">{c.name}</span>
                </Link>
              ))}
              {myCommunities.length === 0 && (
                <div className="px-4 py-3 text-[0.78rem] text-pn-lm italic">No communities yet.</div>
              )}
            </div>
          </div>
          <Link to="/posts/new"
            className="flex items-center justify-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.82rem] px-[14px] py-[10px] rounded-lg mt-3 shadow-[0_4px_12px_rgba(53,88,114,0.2)] hover:bg-[#2a4760]">
            + New Post
          </Link>
        </aside>

        {/* FEED */}
        <div>
          <div className="bg-gradient-to-br from-[rgba(122,170,206,0.12)] via-[rgba(156,213,255,0.08)] to-[rgba(53,88,114,0.06)] backdrop-blur-sm border border-[rgba(122,170,206,0.25)] rounded-[20px] p-6 mb-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,170,206,0.15),transparent_50%)] pointer-events-none" />
            <div className="relative">
              <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.5rem,3vw,2rem)] font-bold text-pn-navy leading-[1.15]">
                Your network, all in one place.
              </h1>
              <p className="text-[0.84rem] text-pn-muted mt-[6px] leading-[1.5] max-w-[480px]">
                Your Feed keeps you connected to the communities and discussions that matter to you, helping you stay involved and informed.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-[0.85rem] font-bold text-pn-navy">{displayedPosts.length} <span className="font-medium text-pn-muted">Posts</span></span>
                <span className="w-1 h-1 rounded-full bg-pn-steel/40" />
                <span className="text-[0.85rem] font-bold text-pn-navy">{myCommunities.length} <span className="font-medium text-pn-muted">Communities</span></span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mb-[14px] flex-wrap">
            <div className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-pn-steel">
              {displayedPosts.length === 0 ? "No posts" : `${displayedPosts.length} ${displayedPosts.length === 1 ? "post" : "posts"}`}
            </div>
            <div
              role="tablist"
              aria-label="Sort feed posts"
              className="inline-flex items-center gap-[3px] bg-pn-white border border-pn-border rounded-[12px] p-[3px] shadow-[0_2px_8px_rgba(53,88,114,0.04)]"
            >
              {SORT_OPTIONS.map((opt) => {
                const active = sortKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setSortKey(opt.key)}
                    className={`text-[0.78rem] font-semibold px-[12px] py-[6px] rounded-[9px] transition-all ${
                      active
                        ? "bg-pn-navy text-white shadow-[0_2px_6px_rgba(26,39,51,0.22)]"
                        : "text-pn-muted border border-transparent hover:border-pn-border hover:text-pn-steel cursor-pointer"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {displayedPosts.map((p, i) => (
            <Link key={p.id} to={`/posts/${p.id}`}
              className="bg-pn-white border border-pn-border rounded-[20px] mb-[14px] overflow-hidden hover:shadow-[0_8px_28px_rgba(53,88,114,0.08)] hover:border-[#D4E2ED] transition-all block">
              <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${AVATARS[i % AVATARS.length]} shrink-0 flex items-center justify-center text-[0.9rem] font-bold text-white`}>
                  {p.authorUsername?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1">
                  <div className="text-[0.9rem] font-semibold text-pn-navy">{p.authorUsername ?? `User #${p.authorId}`}</div>
                  <div className="text-[0.75rem] text-pn-lm">
                    in <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/community/${p.communityId}`); }} className="text-pn-steel font-semibold cursor-pointer hover:underline">{p.communityName ?? `Community #${p.communityId}`}</span>
                  </div>
                </div>
                <div className="text-[0.75rem] text-pn-lm">{timeAgo(p.createdAt)}</div>
              </div>
              <div className="px-5 pb-3">
                <div className="font-['Cormorant_Garamond',serif] text-[1.2rem] font-semibold text-pn-navy mb-2 leading-[1.25]">{p.title}</div>
                <p className="text-[0.875rem] leading-[1.72] text-pn-muted line-clamp-3">{p.content}</p>
              </div>
              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-[6px] px-5 pt-[10px] flex-wrap">
                  {p.tags.map((t) => (
                    <span key={t} className="text-[0.72rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[3px] rounded-full">{t}</span>
                  ))}
                </div>
              )}
              <div className="flex items-center px-5 pt-3 pb-3 border-t border-pn-surface mt-3">
                <span className="flex items-center gap-[6px] text-[0.82rem] font-medium text-pn-lm px-3 py-[6px] rounded-lg">
                  <Heart className="w-[14px] h-[14px]" /> {p.likesCount}
                </span>
                <span className="flex items-center gap-[6px] text-[0.82rem] font-medium text-pn-lm px-3 py-[6px] rounded-lg">
                  <MessageCircle className="w-[14px] h-[14px]" /> {p.commentsCount}
                </span>
                <span className="flex items-center gap-[6px] text-[0.82rem] font-medium text-pn-lm ml-auto px-3 py-[6px] rounded-lg">Share</span>
              </div>
            </Link>
          ))}
          {displayedPosts.length === 0 && (
            <div className="text-center py-20 text-pn-muted">
              <p className="text-lg mb-2">Your feed is empty</p>
              <p className="text-sm">Join communities to see posts here.</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="sticky top-[86px] flex flex-col gap-[14px] max-md:hidden">
          <div className="bg-pn-white border border-pn-border rounded-[20px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-[7px] h-[7px] rounded-full bg-pn-sky animate-pulse-dot" />
              <div className="text-[0.9rem] font-bold text-pn-navy tracking-[-0.01em]">Trending Today</div>
            </div>
            {displayedPosts.slice(0, 3).map((p, i) => (
              <Link key={p.id} to={`/posts/${p.id}`} className="flex gap-3 pb-[10px] mb-[10px] border-b border-pn-surface last:border-b-0 last:pb-0 last:mb-0 hover:bg-[rgba(53,88,114,0.03)] -mx-2 px-2 py-1 rounded-lg transition-colors">
                <span className="text-[1.1rem] font-bold text-pn-sky/60 font-['Cormorant_Garamond',serif] leading-none mt-[2px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[0.84rem] font-semibold text-pn-navy leading-[1.35] line-clamp-2">{p.title}</div>
                  <div className="text-[0.72rem] text-pn-muted mt-[3px]">{p.communityName ?? `Community #${p.communityId}`} · {p.likesCount} likes</div>
                </div>
              </Link>
            ))}
            {displayedPosts.length === 0 && (
              <div className="text-[0.78rem] text-pn-muted">No trending posts yet.</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
