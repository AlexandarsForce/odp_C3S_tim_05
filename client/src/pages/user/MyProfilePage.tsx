import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { Footer } from "../../components/layout/Footer";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import type { PostDto } from "../../types/post/PostTypes";
import type { CommentDto } from "../../types/comment/CommentTypes";
import type { UserDto } from "../../models/user/UserTypes";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

const formatJoinDate = (date: string) =>
  new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDto | undefined>(undefined);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, comments: 0 });
  const [communitiesCount, setCommunitiesCount] = useState(0);
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!user) return;
    usersApi.getById(user.id).then((r) => {
      if (r.success && r.data) {
        setProfile(r.data);
        setBioText(r.data.bio ?? "");
      }
    });
    usersApi.getUserPosts(user.id, 1, 20).then((r) => {
      if (r.success && r.data) {
        setPosts(r.data.items);
        setStats((s) => ({ ...s, posts: r.data!.total }));
      }
    });
    usersApi.getUserComments(user.id, 1, 20).then((r) => {
      if (r.success && r.data) {
        setComments(r.data.items);
        setStats((s) => ({ ...s, comments: r.data!.total }));
      }
    });
    usersApi.getFollowers(user.id, 1, 1).then((r) => {
      if (r.success && r.data) setStats((s) => ({ ...s, followers: r.data!.total }));
    });
    usersApi.getFollowing(user.id, 1, 1).then((r) => {
      if (r.success && r.data) setStats((s) => ({ ...s, following: r.data!.total }));
    });
    communityApi.getMine(1, 1).then((r) => {
      if (r.success && r.data) setCommunitiesCount(r.data.total);
    });
  }, [user]);

  const saveBio = async () => {
    if (!profile || !user) return;
    setSavingBio(true);
    const res = await usersApi.updateMe({
      username: user.username,
      fullname: profile.fullname ?? "",
      email: profile.email ?? "",
      bio: bioText,
      profilePicture: profile.profilePicture ?? "",
    });
    setSavingBio(false);
    if (res.success) {
      setProfile((p) => (p ? { ...p, bio: bioText } : p));
      setEditingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[1000px] mx-auto px-6 py-10 pb-20">
        <div className="bg-pn-white border border-pn-border rounded-[28px] overflow-hidden mb-6 shadow-[0_10px_30px_rgba(53,88,114,0.06)]">
          <div className="relative h-[130px] bg-gradient-to-br from-pn-navy via-pn-steel to-[#2a4760] overflow-hidden">
            <svg
              className="absolute inset-0 w-full h-full opacity-60 pointer-events-none"
              viewBox="0 0 800 130"
              preserveAspectRatio="xMidYMid slice"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <radialGradient id="prof-glow" cx="50%" cy="55%" r="40%">
                  <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#9CD5FF" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="prof-line" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#9CD5FF" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#7AAACE" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <circle cx="400" cy="70" r="110" fill="url(#prof-glow)" />
              <g stroke="url(#prof-line)" strokeWidth="1">
                <line x1="120" y1="35" x2="400" y2="70" />
                <line x1="680" y1="40" x2="400" y2="70" />
                <line x1="220" y1="100" x2="400" y2="70" />
                <line x1="580" y1="100" x2="400" y2="70" />
                <line x1="60" y1="80" x2="400" y2="70" />
                <line x1="740" y1="85" x2="400" y2="70" />
                <line x1="120" y1="35" x2="220" y2="100" />
                <line x1="680" y1="40" x2="580" y2="100" />
              </g>
              <g fill="#9CD5FF">
                <circle cx="120" cy="35" r="3" opacity="0.8" />
                <circle cx="680" cy="40" r="3.5" opacity="0.85" />
                <circle cx="220" cy="100" r="2.5" opacity="0.7" />
                <circle cx="580" cy="100" r="3" opacity="0.8" />
                <circle cx="60" cy="80" r="2" opacity="0.6" />
                <circle cx="740" cy="85" r="2.5" opacity="0.7" />
              </g>
            </svg>
          </div>

          <div className="px-7 pb-6 max-sm:px-5">
            <div className="mt-5 mb-4 flex items-end justify-between gap-4 flex-wrap">
              {profile?.profilePicture && (profile.profilePicture.startsWith("data:") || profile.profilePicture.startsWith("http")) ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-[4px] border-pn-white shadow-[0_6px_18px_rgba(53,88,114,0.2)] shrink-0 bg-pn-bg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pn-sky to-pn-steel border-[4px] border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] text-[2.2rem] font-bold text-white shadow-[0_6px_18px_rgba(53,88,114,0.2)] shrink-0">
                  {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
              )}

              <div className="flex gap-2 mb-1">
                <Link
                  to="/profile/me/followers"
                  className="group flex flex-col items-center bg-pn-bg border border-pn-border rounded-xl px-5 py-2 hover:border-pn-sky hover:bg-[rgba(122,170,206,0.08)] transition-colors cursor-pointer min-w-[88px]"
                >
                  <span className="font-['Cormorant_Garamond',serif] text-[1.35rem] font-bold text-pn-navy leading-none">{stats.followers}</span>
                  <span className="text-[0.68rem] text-pn-lm font-semibold uppercase tracking-[0.08em] mt-1">Followers</span>
                </Link>
                <Link
                  to="/profile/me/followers"
                  className="group flex flex-col items-center bg-pn-bg border border-pn-border rounded-xl px-5 py-2 hover:border-pn-sky hover:bg-[rgba(122,170,206,0.08)] transition-colors cursor-pointer min-w-[88px]"
                >
                  <span className="font-['Cormorant_Garamond',serif] text-[1.35rem] font-bold text-pn-navy leading-none">{stats.following}</span>
                  <span className="text-[0.68rem] text-pn-lm font-semibold uppercase tracking-[0.08em] mt-1">Following</span>
                </Link>
              </div>
            </div>

            <h1 className="font-['Cormorant_Garamond',serif] text-[1.85rem] font-bold text-pn-navy leading-tight">
              {profile?.fullname || user?.username || "User"}
            </h1>
            <div className="flex items-center gap-[8px] mt-1 text-[0.85rem] text-pn-lm flex-wrap">
              <span className="text-pn-muted font-medium">@{user?.username ?? "user"}</span>
              {user?.role && user.role !== "user" && (
                <>
                  <span className="text-pn-border">·</span>
                  <span className="text-[0.72rem] font-semibold uppercase tracking-wider text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.15)] px-[10px] py-[2px] rounded-full">
                    {user.role}
                  </span>
                </>
              )}
              {profile?.createdAt && (
                <>
                  <span className="text-pn-border">·</span>
                  <span>Joined {formatJoinDate(profile.createdAt)}</span>
                </>
              )}
              {communitiesCount > 0 && (
                <>
                  <span className="text-pn-border">·</span>
                  <Link to="/my-communities" className="text-pn-steel font-medium hover:text-pn-sky transition-colors">
                    {communitiesCount} {communitiesCount === 1 ? "community" : "communities"}
                  </Link>
                </>
              )}
            </div>

            <div className="mt-4">
              {editingBio ? (
                <div>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.slice(0, 300))}
                    rows={3}
                    autoFocus
                    className="w-full max-w-[600px] bg-pn-bg border-[1.5px] border-pn-sky rounded-[12px] px-4 py-3 text-[0.9rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] resize-y leading-[1.6] focus:bg-pn-white focus:shadow-[0_0_0_4px_rgba(122,170,206,0.18)] transition-all placeholder:text-pn-lm"
                    placeholder="Tell others a little about yourself…"
                  />
                  <div className="flex items-center justify-between mt-2 max-w-[600px]">
                    <span className="text-[0.72rem] text-pn-lm">{bioText.length} / 300</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditingBio(false); setBioText(profile?.bio ?? ""); }}
                        className="text-[0.82rem] font-semibold text-pn-muted px-4 py-[7px] rounded-lg hover:text-pn-steel transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBio}
                        disabled={savingBio}
                        className="text-[0.82rem] font-semibold text-white bg-pn-steel px-4 py-[7px] rounded-lg shadow-[0_4px_12px_rgba(53,88,114,0.18)] hover:bg-[#2a4760] disabled:opacity-50 transition-all cursor-pointer"
                      >
                        {savingBio ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 justify-between">
                  <p className="text-[0.92rem] leading-[1.7] text-pn-muted flex-1 max-w-[640px]">
                    {profile?.bio ? profile.bio : <span className="italic text-pn-lm">No bio yet — add a few words about yourself.</span>}
                  </p>
                  <button
                    onClick={() => setEditingBio(true)}
                    aria-label="Edit bio"
                    title="Edit bio"
                    className="shrink-0 inline-flex items-center gap-[6px] bg-pn-steel text-white text-[0.78rem] font-semibold px-3 py-[7px] rounded-lg shadow-[0_4px_12px_rgba(53,88,114,0.18)] hover:bg-[#2a4760] transition-colors cursor-pointer"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Edit bio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-6 border-b border-pn-border mb-5">
          <button
            onClick={() => setTab("posts")}
            className={`pb-3 px-1 text-[0.875rem] font-semibold transition-colors cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
              tab === "posts"
                ? "border-pn-steel text-pn-navy"
                : "border-transparent text-pn-muted hover:text-pn-steel"
            }`}
          >
            Posts
            <span className={`text-[0.7rem] font-semibold px-[7px] py-[1px] rounded-full ${
              tab === "posts" ? "bg-[rgba(53,88,114,0.12)] text-pn-steel" : "bg-pn-bg text-pn-lm"
            }`}>{stats.posts}</span>
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`pb-3 px-1 text-[0.875rem] font-semibold transition-colors cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
              tab === "comments"
                ? "border-pn-steel text-pn-navy"
                : "border-transparent text-pn-muted hover:text-pn-steel"
            }`}
          >
            Comments
            <span className={`text-[0.7rem] font-semibold px-[7px] py-[1px] rounded-full ${
              tab === "comments" ? "bg-[rgba(53,88,114,0.12)] text-pn-steel" : "bg-pn-bg text-pn-lm"
            }`}>{stats.comments}</span>
          </button>
        </div>

        {tab === "posts" && (
          posts.length === 0 ? (
            <div className="bg-pn-white border border-pn-border rounded-2xl px-6 py-9 text-center">
              <div className="w-11 h-11 rounded-xl bg-[rgba(122,170,206,0.14)] flex items-center justify-center text-pn-steel mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 3v4a1 1 0 0 0 1 1h4" />
                  <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
                  <line x1="9" y1="13" x2="15" y2="13" />
                </svg>
              </div>
              <p className="font-['Cormorant_Garamond',serif] text-[1.2rem] font-semibold text-pn-navy mb-1">No posts yet</p>
              <p className="text-[0.86rem] text-pn-muted mb-4 max-w-[380px] mx-auto leading-[1.55]">
                Share a thought, a question, or something you learned — your first post can start a conversation.
              </p>
              <Link
                to="/posts/new"
                className="inline-block bg-pn-steel text-white font-semibold text-[0.86rem] px-5 py-[9px] rounded-xl shadow-[0_5px_14px_rgba(53,88,114,0.18)] hover:bg-[#2a4760] transition-colors"
              >
                Write your first post
              </Link>
            </div>
          ) : (
            <div className="space-y-[10px]">
              {posts.map((p) => (
                <div key={p.id} className="bg-pn-white border border-pn-border rounded-[18px] px-5 py-[18px] hover:shadow-[0_5px_18px_rgba(53,88,114,0.07)] hover:border-pn-sky transition-all">
                  <span className="text-[0.72rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.12)] px-[10px] py-[3px] rounded-full inline-block mb-[8px]">
                    {p.communityName ?? `Community #${p.communityId}`}
                  </span>
                  <Link to={`/posts/${p.id}`} className="block">
                    <div className="font-['Cormorant_Garamond',serif] text-[1.15rem] font-semibold text-pn-navy mb-[6px] leading-[1.3] hover:text-pn-steel transition-colors">{p.title}</div>
                  </Link>
                  <p className="text-[0.86rem] leading-[1.7] text-pn-muted mb-[10px] line-clamp-3">{p.content}</p>
                  <div className="flex items-center gap-[14px] text-[0.78rem] text-pn-lm">
                    <span className="inline-flex items-center gap-[5px]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                      {p.likesCount}
                    </span>
                    <span className="inline-flex items-center gap-[5px]">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      {p.commentsCount}
                    </span>
                    <span className="ml-auto">{timeAgo(p.createdAt)}</span>
                    <Link
                      to={`/posts/${p.id}/edit`}
                      className="text-[0.72rem] font-semibold text-[#7A6020] bg-[rgba(195,150,40,0.08)] border border-[rgba(195,150,40,0.18)] px-[10px] py-[3px] rounded-md hover:bg-[rgba(195,150,40,0.14)] transition-colors"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === "comments" && (
          comments.length === 0 ? (
            <div className="bg-pn-white border border-pn-border rounded-2xl px-6 py-9 text-center">
              <div className="w-11 h-11 rounded-xl bg-[rgba(122,170,206,0.14)] flex items-center justify-center text-pn-steel mx-auto mb-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <p className="font-['Cormorant_Garamond',serif] text-[1.2rem] font-semibold text-pn-navy mb-1">No comments yet</p>
              <p className="text-[0.86rem] text-pn-muted max-w-[380px] mx-auto leading-[1.55]">
                Jump into a discussion in your communities — your replies will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-[10px]">
              {comments.map((c) => (
                <Link
                  key={c.id}
                  to={`/posts/${c.postId}`}
                  className="block bg-pn-white border border-pn-border rounded-[18px] px-5 py-[18px] hover:shadow-[0_5px_18px_rgba(53,88,114,0.07)] hover:border-pn-sky transition-all"
                >
                  <p className="text-[0.9rem] leading-[1.7] text-pn-navy mb-[10px]">{c.content}</p>
                  <div className="flex items-center gap-[14px] text-[0.78rem] text-pn-lm">
                    <span className="inline-flex items-center gap-[5px] text-pn-steel font-medium">
                      View post
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                    <span className="ml-auto">{timeAgo(c.createdAt)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
