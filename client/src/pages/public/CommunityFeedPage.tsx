import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import { postApi } from "../../api_services/posts/PostAPIService";
import { tagApi } from "../../api_services/tags/TagAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import type { CommunityDto, CommunityMemberDto } from "../../types/community/CommunityTypes";
import type { PostDto, PostSortOption } from "../../types/post/PostTypes";
import type { TagDto } from "../../types/tag/TagTypes";

const SORT_OPTIONS: PostSortOption[] = [
  { key: "newest",   label: "Newest",          sortBy: "createdAt",     sortOrder: "desc" },
  { key: "top",      label: "Most liked",      sortBy: "likesCount",    sortOrder: "desc" },
  { key: "discussed",label: "Most commented",  sortBy: "commentsCount", sortOrder: "desc" },
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

export default function CommunityFeedPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityDto | null>(null);
  const [members, setMembers] = useState<CommunityMemberDto[]>([]);
  const [totalMembers, setTotalMembers] = useState(0);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [tags, setTags] = useState<TagDto[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [sortKey, setSortKey] = useState<string>("newest");
  const [postsLoading, setPostsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    setPostsLoading(true);
    const sort = SORT_OPTIONS.find((o) => o.key === sortKey) ?? SORT_OPTIONS[0];
    const [commRes, postRes, tagRes] = await Promise.all([
      communityApi.getById(Number(id), 20),
      postApi.getByCommunity(Number(id), { sortBy: sort.sortBy, sortOrder: sort.sortOrder }),
      tagApi.getAll(),
    ]);
    if (commRes.success && commRes.data) {
      setCommunity(commRes.data);
      const m = commRes.members as { items?: CommunityMemberDto[]; total?: number } | CommunityMemberDto[] | undefined;
      if (Array.isArray(m)) {
        setMembers(m);
        setTotalMembers(m.length);
      } else if (m && Array.isArray(m.items)) {
        setMembers(m.items);
        setTotalMembers(m.total ?? m.items.length);
      } else {
        setMembers([]);
        setTotalMembers(0);
      }
    }
    if (postRes.success && postRes.data) setPosts(postRes.data.items);
    if (tagRes.success && tagRes.data) setTags(tagRes.data);
    setPostsLoading(false);
  }, [id, sortKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setIsMember(members.some((m) => m.userId === user?.id));
  }, [members, user]);

  const handleJoin = async () => {
    if (!isAuthenticated) { navigate(`/login?next=/community/${id}`); return; }
    if (!id) return;
    await communityApi.join(Number(id));
    fetchData();
  };

  const handleLeave = async () => {
    if (!id) return;
    await communityApi.leave(Number(id));
    fetchData();
  };

  const displayedPosts = useMemo(() => {
    if (!selectedTagId) return posts;
    const selectedTag = tags.find((tag) => tag.id === selectedTagId);
    return posts.filter((post) => {
      if (post.tagIds?.includes(selectedTagId)) return true;
      if (!selectedTag?.name) return false;
      return post.tags?.some((tag) => tag.toLowerCase() === selectedTag.name.toLowerCase()) ?? false;
    });
  }, [posts, selectedTagId, tags]);

  const getPostTags = (post: PostDto) => {
    if (post.tags && post.tags.length > 0) return post.tags;
    return (post.tagIds ?? [])
      .map((tagId) => tags.find((tag) => tag.id === tagId)?.name)
      .filter((tagName): tagName is string => Boolean(tagName));
  };

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <nav className="sticky top-0 z-100 bg-[rgba(247,248,240,0.92)] backdrop-blur-[12px] border-b border-pn-border px-6">
        <div className="max-w-[1120px] mx-auto h-[60px] flex items-center justify-between">
          <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-semibold text-pn-steel">
            Pulse<span className="text-pn-sky">Net</span>
          </Link>
          <div className="flex gap-2 items-center">
            <Link to="/feed" className="text-[0.875rem] font-medium text-pn-muted px-3 py-[6px] rounded-lg hover:text-pn-steel">Feed</Link>
            <Link to="/my-communities" className="text-[0.875rem] font-medium text-pn-muted px-3 py-[6px] rounded-lg hover:text-pn-steel">Communities</Link>
            <Link to="/profile/me" className="text-[0.875rem] font-semibold text-white bg-pn-steel px-[18px] py-[8px] rounded-lg">My Account</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-[1120px] mx-auto px-6 py-10 pb-20 grid grid-cols-[1fr_320px] gap-7 items-start max-md:grid-cols-1">
        <div>
          <div className="flex items-center gap-2 text-[0.82rem] text-pn-lm mb-5">
            <Link to="/feed" className="text-pn-lm hover:text-pn-steel">Feed</Link>
            <span className="text-pn-border">&rsaquo;</span>
            <span className="text-pn-steel font-semibold">{community?.name ?? "Community"}</span>
          </div>

          <div className="bg-pn-white border border-pn-border rounded-2xl p-7 mb-5 shadow-[0_8px_24px_rgba(53,88,114,0.06)]">
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-[14px] bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[1.5rem] font-bold text-white shrink-0">
                  {community?.name?.charAt(0)?.toUpperCase() ?? "C"}
                </div>
                <div>
                  <div className="font-['Cormorant_Garamond',serif] text-[1.6rem] font-bold text-pn-navy mb-1">{community?.name ?? "Community"}</div>
                  <p className="text-[0.875rem] text-pn-muted leading-[1.6]">{community?.description || "No description provided."}</p>
                </div>
              </div>
              <div className="flex flex-row gap-2 items-center shrink-0">
                {isMember ? (
                  <>
                    <Link to={`/community/${id}/members`}
                      className="px-[18px] py-[9px] bg-transparent text-pn-steel font-semibold text-[0.85rem] rounded-lg border border-pn-border hover:border-pn-sky hover:bg-[rgba(122,170,206,0.06)] transition-colors cursor-pointer">
                      Members
                    </Link>
                    <button onClick={handleLeave}
                      className="px-3 py-[7px] bg-transparent text-pn-muted font-medium text-[0.8rem] rounded-lg hover:bg-[rgba(155,58,58,0.08)] hover:text-pn-red transition-colors cursor-pointer">
                      Leave
                    </button>
                  </>
                ) : (
                  <button onClick={handleJoin}
                    className="px-[22px] py-[10px] bg-pn-steel text-white font-semibold text-[0.875rem] rounded-xl shadow-[0_6px_16px_rgba(53,88,114,0.2)] hover:bg-[#2a4760] cursor-pointer">
                    {community?.type === "public" ? "+ Join" : "+ Request to Join"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {isMember && (
            <Link to={`/posts/new?community=${id}`}
              className="block bg-pn-white border border-pn-border rounded-[20px] px-5 py-4 mb-4 text-[0.875rem] text-pn-lm hover:border-pn-sky hover:text-pn-steel transition-all">
              + Write a new post in this community...
            </Link>
          )}

          {/* Sort selector — segmented control aligned with toolbar rhythm */}
          <div className="flex items-center justify-between gap-3 mb-[14px] flex-wrap">
            <div className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-pn-lm">
              {displayedPosts.length === 0 ? "No posts" : `${displayedPosts.length} ${displayedPosts.length === 1 ? "post" : "posts"}`}
            </div>
            <div
              role="tablist"
              aria-label="Sort posts"
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
                        ? "bg-pn-steel text-white shadow-[0_2px_6px_rgba(53,88,114,0.18)]"
                        : "text-pn-muted hover:text-pn-steel hover:bg-[rgba(53,88,114,0.05)] cursor-pointer"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tags.length > 0 && (
            <div className="bg-pn-white border border-pn-border rounded-[16px] p-3 mb-[14px]">
              <div className="flex items-center gap-[8px] flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedTagId(null)}
                  className={`text-[0.76rem] font-semibold px-[11px] py-[5px] rounded-full border transition-all ${
                    selectedTagId === null
                      ? "bg-pn-steel text-white border-pn-steel"
                      : "bg-pn-bg text-pn-muted border-pn-border hover:text-pn-steel hover:border-pn-sky"
                  }`}
                >
                  All tags
                </button>
                {tags.map((tag) => {
                  const active = selectedTagId === tag.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setSelectedTagId(active ? null : tag.id)}
                      className={`text-[0.76rem] font-semibold px-[11px] py-[5px] rounded-full border transition-all ${
                        active
                          ? "bg-pn-steel text-white border-pn-steel"
                          : "bg-pn-bg text-pn-muted border-pn-border hover:text-pn-steel hover:border-pn-sky"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {postsLoading && posts.length === 0 && (
            <div className="bg-pn-white border border-pn-border rounded-[20px] py-12 text-center text-pn-muted">
              <p className="text-sm">Loading posts…</p>
            </div>
          )}

          {!postsLoading && displayedPosts.length === 0 && (
            <div className="bg-pn-white border border-pn-border rounded-[20px] py-12 text-center text-pn-muted">
              <p className="text-sm">{selectedTagId ? "No posts match this tag." : "No posts in this community yet."}</p>
            </div>
          )}

          {displayedPosts.map((p, i) => {
            const postTags = getPostTags(p);
            return (
            <Link key={p.id} to={`/posts/${p.id}`}
              className="bg-pn-white border border-pn-border rounded-[20px] mb-[14px] overflow-hidden hover:shadow-[0_8px_28px_rgba(53,88,114,0.08)] hover:border-[#D4E2ED] transition-all block">
              <div className="flex items-center gap-3 px-5 pt-[18px] pb-[14px]">
                <div className={`w-[38px] h-[38px] rounded-full bg-gradient-to-br ${AVATARS[i % AVATARS.length]} shrink-0 flex items-center justify-center text-[0.9rem] font-bold text-white`}>
                  {p.authorUsername?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1">
                  <div className="text-[0.9rem] font-semibold text-pn-navy">{p.authorUsername ?? "unknown"}</div>
                  <div className="text-[0.75rem] text-pn-lm">{timeAgo(p.createdAt)}</div>
                </div>
              </div>
              <div className="px-5 pb-[14px]">
                <div className="font-['Cormorant_Garamond',serif] text-[1.15rem] font-semibold text-pn-navy mb-2 leading-[1.3]">{p.title}</div>
                <p className="text-[0.875rem] leading-[1.7] text-pn-muted">{p.content}</p>
              </div>
              {postTags.length > 0 && (
                <div className="flex gap-[6px] px-5 pb-[12px] flex-wrap">
                  {postTags.map((t) => (
                    <span key={t} className="text-[0.72rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.14)] px-[10px] py-[3px] rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-4 px-5 py-3 border-t border-pn-surface">
                <span className="inline-flex items-center gap-[6px] text-[0.82rem] text-pn-lm font-medium">
                  <Heart className="w-[14px] h-[14px]" /> {p.likesCount}
                </span>
                <span className="inline-flex items-center gap-[6px] text-[0.82rem] text-pn-lm font-medium">
                  <MessageCircle className="w-[14px] h-[14px]" /> {p.commentsCount}
                </span>
              </div>
            </Link>
            );
          })}

          {!isAuthenticated && (
            <div className="bg-pn-white border border-pn-border rounded-2xl p-7 mt-5 text-center">
              <p className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-2">Join to participate</p>
              <p className="text-[0.875rem] text-pn-muted mb-4">Create a free account to access all posts, comments, and join the conversation.</p>
              <Link to="/register"
                className="inline-block bg-pn-steel text-white font-semibold text-[0.9rem] px-6 py-3 rounded-xl shadow-[0_6px_16px_rgba(53,88,114,0.2)] hover:bg-[#2a4760]">Sign Up Free</Link>
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-4 max-md:hidden">
          <div className="bg-pn-white border border-pn-border rounded-[20px] p-5">
            <div className="font-['Cormorant_Garamond',serif] text-[1.1rem] font-semibold text-pn-navy mb-[14px]">Community Stats</div>
            {[
              { lbl: "Members", val: String(totalMembers) },
              { lbl: "Posts", val: String(posts.length) },
              { lbl: "Visibility", val: community?.type === "private" ? "Private" : "Public" },
              { lbl: "Created", val: community?.createdAt ? new Date(community.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "—" },
            ].map((s) => (
              <div key={s.lbl} className="flex justify-between text-[0.85rem] py-2 border-b border-pn-surface last:border-b-0 last:pb-0">
                <span className="text-pn-muted">{s.lbl}</span>
                <span className="font-semibold text-pn-steel">{s.val}</span>
              </div>
            ))}
          </div>
          {community?.rules && (
            <div className="bg-pn-white border border-pn-border rounded-[20px] p-5">
              <div className="font-['Cormorant_Garamond',serif] text-[1.1rem] font-semibold text-pn-navy mb-[14px]">Community Rules</div>
              <div className="text-[0.83rem] leading-[1.7] text-pn-muted whitespace-pre-wrap">
                {community.rules}
              </div>
            </div>
          )}
          <div className="relative overflow-hidden rounded-[20px] border border-pn-border bg-gradient-to-br from-pn-navy via-pn-steel to-[#2a4760] p-5 shadow-[0_10px_28px_rgba(26,39,51,0.18)]">
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.55] pointer-events-none"
              viewBox="0 0 320 220"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="pn-glow" cx="50%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#9CD5FF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="pn-line" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#7AAACE" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <circle cx="160" cy="95" r="100" fill="url(#pn-glow)" />
              <g stroke="url(#pn-line)" strokeWidth="1">
                <line x1="160" y1="95" x2="60" y2="40" />
                <line x1="160" y1="95" x2="260" y2="45" />
                <line x1="160" y1="95" x2="40" y2="135" />
                <line x1="160" y1="95" x2="280" y2="150" />
                <line x1="160" y1="95" x2="100" y2="180" />
                <line x1="160" y1="95" x2="220" y2="185" />
                <line x1="60" y1="40" x2="40" y2="135" />
                <line x1="260" y1="45" x2="280" y2="150" />
                <line x1="100" y1="180" x2="220" y2="185" />
              </g>
              <g fill="#9CD5FF">
                <circle cx="60" cy="40" r="3.5" opacity="0.85" />
                <circle cx="260" cy="45" r="3" opacity="0.75" />
                <circle cx="40" cy="135" r="2.5" opacity="0.7" />
                <circle cx="280" cy="150" r="3.5" opacity="0.85" />
                <circle cx="100" cy="180" r="2.5" opacity="0.7" />
                <circle cx="220" cy="185" r="3" opacity="0.8" />
              </g>
              <circle cx="160" cy="95" r="9" fill="#9CD5FF" opacity="0.25" />
              <circle cx="160" cy="95" r="5.5" fill="#fff" className="animate-pulse-dot" />
            </svg>

            <div className="relative">
              <span className="inline-flex items-center gap-[6px] text-[0.66rem] font-bold uppercase tracking-[0.14em] text-pn-pale">
                <span className="w-[6px] h-[6px] rounded-full bg-pn-pale animate-pulse-dot" />
                PulseNet
              </span>
              <p className="font-['Cormorant_Garamond',serif] text-[1.35rem] leading-[1.25] font-semibold text-white mt-[10px] mb-2">
                A pulse for every<br />conversation.
              </p>
              <p className="text-[0.78rem] leading-[1.6] text-[rgba(255,255,255,0.72)] mt-[60px] max-w-[230px]">
                You're connected to <strong className="text-white font-semibold">{totalMembers}</strong> {totalMembers === 1 ? "voice" : "voices"} in this circle.
              </p>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
