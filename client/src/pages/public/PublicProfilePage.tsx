import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { usersApi } from "../../api_services/users/UsersAPIService";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import type { PostDto } from "../../types/post/PostTypes";
import type { UserDto } from "../../models/user/UserTypes";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [profileUser, setProfileUser] = useState<UserDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [tab, setTab] = useState<"posts" | "comments">("posts");
  const [notFound, setNotFound] = useState(false);

  const targetId = id ? Number(id) : NaN;
  const isOwnProfile = !!user && user.id === targetId;

  useEffect(() => {
    if (Number.isNaN(targetId)) { setNotFound(true); return; }
    if (user && user.id === targetId) { navigate("/profile/me", { replace: true }); return; }

    usersApi.getById(targetId).then((r) => {
      if (r.success && r.data) setProfileUser(r.data);
      else setNotFound(true);
    });
    usersApi.getUserPosts(targetId, 1, 20).then((r) => {
      if (r.success && r.data) {
        setPosts(r.data.items);
        setStats((s) => ({ ...s, posts: r.data!.total }));
      }
    });
    usersApi.getFollowers(targetId, 1, 50).then((r) => {
      if (r.success && r.data) {
        setStats((s) => ({ ...s, followers: r.data!.total }));
        if (user) setIsFollowing(r.data.items.some((f) => f.followerId === user.id));
      }
    });
    usersApi.getFollowing(targetId, 1, 1).then((r) => {
      if (r.success && r.data) setStats((s) => ({ ...s, following: r.data!.total }));
    });
  }, [targetId, user, navigate]);

  const handleFollow = async () => {
    if (!profileUser) return;
    if (isFollowing) {
      const r = await usersApi.unfollow(profileUser.id);
      if (r.success) {
        setIsFollowing(false);
        setStats((s) => ({ ...s, followers: Math.max(0, s.followers - 1) }));
      }
    } else {
      const r = await usersApi.follow(profileUser.id);
      if (r.success) {
        setIsFollowing(true);
        setStats((s) => ({ ...s, followers: s.followers + 1 }));
      }
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
        <AppNavbar />
        <div className="max-w-[800px] mx-auto px-6 py-16 text-center text-pn-muted">
          <p className="text-lg mb-3">Profile not found</p>
          <Link to="/feed" className="text-pn-steel font-semibold">Back to feed</Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy flex items-center justify-center">
        <p className="text-[0.95rem] text-pn-muted">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[960px] mx-auto px-6 py-9 pb-20">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-5">
          <Link to="/feed" className="text-pn-lm hover:text-pn-steel">Feed</Link>
          <span>›</span>
          <span className="text-pn-steel font-semibold">{profileUser.username}</span>
        </div>

        <div className="bg-pn-white border border-pn-border rounded-[28px] overflow-hidden mb-5 shadow-[0_8px_28px_rgba(53,88,114,0.07)]">
          <div className="h-[90px] bg-gradient-to-r from-[#2C3E4F] via-pn-steel to-pn-sky" />
          <div className="px-[26px] pb-[26px]">
            <div className="-mt-9 mb-[14px] flex items-end justify-between flex-wrap gap-[10px]">
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-pn-sky to-pn-steel border-[3px] border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-white shadow-[0_4px_14px_rgba(53,88,114,0.2)]">
                {profileUser.username?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              {!isOwnProfile && isAuthenticated && (
                <div className="pt-10 flex gap-2">
                  <button onClick={handleFollow}
                    className={`inline-flex items-center gap-[7px] font-semibold text-[0.9rem] px-[22px] py-[10px] rounded-xl transition-all cursor-pointer ${
                      isFollowing
                        ? "bg-pn-white text-pn-steel border-[1.5px] border-pn-border hover:border-[rgba(180,60,60,0.3)] hover:text-[#9B3A3A]"
                        : "bg-pn-steel text-white shadow-[0_5px_16px_rgba(53,88,114,0.22)] hover:bg-[#2a4760]"
                    }`}>
                    {isFollowing ? "✓ Following" : "+ Follow"}
                  </button>
                </div>
              )}
              {!isAuthenticated && (
                <div className="pt-10">
                  <Link to="/login"
                    className="inline-flex items-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.9rem] px-[22px] py-[10px] rounded-xl shadow-[0_5px_16px_rgba(53,88,114,0.22)] hover:bg-[#2a4760]">
                    Sign in to Follow
                  </Link>
                </div>
              )}
            </div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.7rem] font-bold text-pn-navy mb-1">{profileUser.fullname || profileUser.username}</div>
            <div className="text-[0.875rem] text-pn-lm mb-[10px]">
              @{profileUser.username}
              {profileUser.createdAt && ` · Member since ${new Date(profileUser.createdAt).getFullYear()}`}
            </div>
            <p className="text-[0.9rem] leading-[1.7] text-pn-muted max-w-[540px] mb-[18px]">
              {profileUser.bio || "No bio yet."}
            </p>
            <div className="flex gap-5 flex-wrap pt-4 border-t border-pn-surface">
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.followers}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Followers</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.following}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Following</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.posts}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Posts</span>
              </div>
            </div>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="bg-pn-white border border-pn-border rounded-[20px] p-6 mb-5 text-center">
            <p className="text-[0.9rem] text-pn-muted mb-4">Sign in to follow, see followers, following, and interact with posts.</p>
            <Link to="/login"
              className="inline-flex items-center gap-[7px] bg-pn-steel text-white font-semibold text-[0.9rem] px-[22px] py-[10px] rounded-xl shadow-[0_5px_16px_rgba(53,88,114,0.22)] hover:bg-[#2a4760]">
              Sign In
            </Link>
          </div>
        )}

        <div className="flex gap-1 bg-pn-white border border-pn-border rounded-[13px] p-1 mb-[18px] w-fit">
          <button onClick={() => setTab("posts")}
            className={`px-[18px] py-2 rounded-[9px] text-[0.85rem] font-semibold cursor-pointer transition-colors ${tab === "posts" ? "bg-pn-steel text-white" : "text-pn-muted hover:text-pn-steel"}`}>
            Posts ({posts.length})
          </button>
          <button onClick={() => setTab("comments")}
            className={`px-[18px] py-2 rounded-[9px] text-[0.85rem] font-semibold cursor-pointer transition-colors ${tab === "comments" ? "bg-pn-steel text-white" : "text-pn-muted hover:text-pn-steel"}`}>
            Comments
          </button>
        </div>

        {tab === "posts" && posts.length === 0 && (
          <div className="text-center py-16 text-pn-muted">
            <p className="text-sm">No posts yet.</p>
          </div>
        )}

        {tab === "posts" && posts.length > 0 && (
          <div>
            {posts.map((p) => (
              <div key={p.id} className="bg-pn-white border border-pn-border rounded-[18px] px-5 py-[18px] mb-[10px] hover:shadow-[0_5px_18px_rgba(53,88,114,0.07)] hover:border-[#D4E2ED] transition-all">
                <span className="text-[0.72rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] px-[10px] py-[3px] rounded-full inline-block mb-[7px]">
                  {p.communityName ?? `Community #${p.communityId}`}
                </span>
                <Link to={`/posts/${p.id}`}>
                  <div className="font-['Cormorant_Garamond',serif] text-[1.1rem] font-semibold text-pn-navy mb-[6px] leading-[1.25]">{p.title}</div>
                </Link>
                <p className="text-[0.85rem] leading-[1.68] text-pn-muted mb-[10px] line-clamp-3">{p.content}</p>
                <div className="flex items-center gap-[14px] text-[0.78rem] text-pn-lm">
                  <span>♥ {p.likesCount}</span>
                  <span>💬 {p.commentsCount}</span>
                  <span className="ml-auto">{timeAgo(p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "comments" && (
          <div className="text-center py-16 text-pn-muted">
            <p className="text-sm">Comments will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
