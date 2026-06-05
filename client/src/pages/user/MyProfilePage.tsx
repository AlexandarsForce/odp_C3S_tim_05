import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
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

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export default function MyProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserDto | null>(null);
  const [posts, setPosts] = useState<PostDto[]>([]);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0, comments: 0, communities: 0 });
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
      if (r.success && r.data) setStats((s) => ({ ...s, communities: r.data!.total }));
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

      <div className="max-w-[1000px] mx-auto px-6 py-9 pb-20">
        <div className="bg-pn-white border border-pn-border rounded-[28px] overflow-hidden mb-5 shadow-[0_8px_28px_rgba(53,88,114,0.07)]">
          <div className="h-[90px] bg-gradient-to-r from-[#2C3E4F] via-pn-steel to-pn-sky" />
          <div className="px-[26px] pb-[26px]">
            <div className="-mt-9 mb-[14px] flex items-end justify-between flex-wrap gap-[10px]">
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-pn-sky to-pn-steel border-[3px] border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] text-[1.8rem] font-bold text-white shadow-[0_4px_14px_rgba(53,88,114,0.2)]">
                {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
            </div>

            <div className="font-['Cormorant_Garamond',serif] text-[1.7rem] font-bold text-pn-navy mb-1">
              {profile?.fullname || user?.username || "User"}
            </div>
            <div className="text-[0.875rem] text-pn-lm mb-[10px]">
              @{user?.username ?? "user"}
              {profile?.createdAt && (
                <span> · Member since <time dateTime={profile.createdAt}>{formatDate(profile.createdAt)}</time></span>
              )}
            </div>

            {/* Bio with inline edit */}
            <div className="mb-4">
              {editingBio ? (
                <div>
                  <textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value.slice(0, 300))}
                    rows={3}
                    autoFocus
                    className="w-full max-w-[540px] bg-pn-bg border-[1.5px] border-pn-sky rounded-[11px] px-4 py-3 text-[0.9rem] text-pn-navy outline-none font-['DM_Sans',sans-serif] resize-y leading-[1.55] focus:shadow-[0_0_0_3px_rgba(122,170,206,0.14)] transition-all"
                    placeholder="Tell others a little about yourself…"
                  />
                  <div className="text-[0.72rem] text-pn-lm mb-2">{bioText.length} / 300</div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveBio}
                      disabled={savingBio}
                      className="text-[0.82rem] font-semibold text-white bg-pn-steel px-4 py-[6px] rounded-lg hover:bg-[#2a4760] transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {savingBio ? "Saving…" : "Save"}
                    </button>
                    <button
                      onClick={() => { setEditingBio(false); setBioText(profile?.bio ?? ""); }}
                      className="text-[0.82rem] font-semibold text-pn-muted px-4 py-[6px] rounded-lg border border-pn-border hover:border-pn-sky transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="text-[0.9rem] leading-[1.7] text-pn-muted max-w-[540px]">
                    {profile?.bio ? profile.bio : <span className="italic">No bio yet.</span>}
                  </p>
                  <button
                    onClick={() => setEditingBio(true)}
                    title="Edit bio"
                    className="shrink-0 text-pn-lm hover:text-pn-steel transition-colors cursor-pointer mt-[3px] text-[0.85rem]"
                  >
                    ✎
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-5 flex-wrap pt-[14px] border-t border-pn-surface">
              <Link to="/profile/me/followers" className="flex flex-col gap-[2px] cursor-pointer hover:opacity-80">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.followers}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Followers</span>
              </Link>
              <Link to="/profile/me/followers" className="flex flex-col gap-[2px] cursor-pointer hover:opacity-80">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.following}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Following</span>
              </Link>
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.posts}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Posts</span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.comments}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Comments</span>
              </div>
              <Link to="/my-communities" className="flex flex-col gap-[2px] cursor-pointer hover:opacity-80">
                <span className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-pn-navy leading-none">{stats.communities}</span>
                <span className="text-[0.72rem] text-pn-lm font-medium">Communities</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-pn-white border border-pn-border rounded-[13px] p-1 mb-[18px] w-fit">
          <button
            onClick={() => setTab("posts")}
            className={`px-[18px] py-2 rounded-[9px] text-[0.85rem] font-semibold cursor-pointer transition-colors ${tab === "posts" ? "bg-pn-steel text-white" : "text-pn-muted hover:text-pn-steel"}`}
          >
            Posts ({stats.posts})
          </button>
          <button
            onClick={() => setTab("comments")}
            className={`px-[18px] py-2 rounded-[9px] text-[0.85rem] font-semibold cursor-pointer transition-colors ${tab === "comments" ? "bg-pn-steel text-white" : "text-pn-muted hover:text-pn-steel"}`}
          >
            Comments ({stats.comments})
          </button>
        </div>

        {tab === "posts" && posts.length === 0 && (
          <div className="text-center py-16 text-pn-muted">
            <p className="text-sm">You haven't posted anything yet.</p>
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
                  <div className="flex gap-[6px] ml-2">
                    <Link
                      to={`/posts/${p.id}/edit`}
                      className="text-[0.72rem] font-semibold text-[#7A6020] bg-[rgba(195,150,40,0.09)] border border-[rgba(195,150,40,0.2)] px-[10px] py-[3px] rounded-md"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "comments" && comments.length === 0 && (
          <div className="text-center py-16 text-pn-muted">
            <p className="text-sm">You haven't commented anything yet.</p>
          </div>
        )}

        {tab === "comments" && comments.length > 0 && (
          <div>
            {comments.map((c) => (
              <Link
                key={c.id}
                to={`/posts/${c.postId}`}
                className="block bg-pn-white border border-pn-border rounded-[18px] px-5 py-[18px] mb-[10px] hover:shadow-[0_5px_18px_rgba(53,88,114,0.07)] hover:border-[#D4E2ED] transition-all"
              >
                <p className="text-[0.9rem] leading-[1.68] text-pn-navy mb-[10px]">{c.content}</p>
                <div className="flex items-center gap-[14px] text-[0.78rem] text-pn-lm">
                  <span className="text-pn-steel font-medium">→ View post</span>
                  <span className="ml-auto">{timeAgo(c.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
