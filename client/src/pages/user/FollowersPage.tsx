import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { usersApi } from "../../api_services/users/UsersAPIService";

const GRADIENTS = [
  "from-pn-sky to-pn-steel",
  "from-pn-steel to-pn-navy",
  "from-pn-pale to-pn-sky",
  "from-pn-lm to-pn-steel",
  "from-pn-steel to-pn-sky",
  "from-pn-navy to-pn-steel",
];

type DisplayUser = { id: number; username: string };

export default function FollowersPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [stats, setStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (tab === "followers") {
      const r = await usersApi.getFollowers(user.id, 1, 50);
      if (r.success && r.data) {
        setUsers(r.data.items.map((f) => ({
          id: f.followerId,
          username: f.followerUsername ?? `user${f.followerId}`,
        })));
        setStats((s) => ({ ...s, followers: r.data!.total }));
      } else {
        setUsers([]);
      }
    } else {
      const r = await usersApi.getFollowing(user.id, 1, 50);
      if (r.success && r.data) {
        setUsers(r.data.items.map((f) => ({
          id: f.followingId,
          username: f.followingUsername ?? `user${f.followingId}`,
        })));
        setStats((s) => ({ ...s, following: r.data!.total }));
      } else {
        setUsers([]);
      }
    }
    setLoading(false);
  }, [user, tab]);

  useEffect(() => {
    if (!user) return;
    usersApi.getFollowers(user.id, 1, 1).then((r) => {
      if (r.success && r.data) setStats((s) => ({ ...s, followers: r.data!.total }));
    });
    usersApi.getFollowing(user.id, 1, 1).then((r) => {
      if (r.success && r.data) setStats((s) => ({ ...s, following: r.data!.total }));
    });
  }, [user]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleUnfollow = async (id: number) => {
    await usersApi.unfollow(id);
    loadUsers();
  };

  const handleRemoveFollower = async (followerId: number) => {
    await usersApi.removeFollower(followerId);
    loadUsers();
  };

  const filtered = users.filter((u) => u.username.toLowerCase().includes(search.toLowerCase()));

  if (!user) return null;

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <div className="max-w-[800px] mx-auto px-6 py-9 pb-20">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[18px]">
          <Link to="/profile/me" className="text-pn-lm hover:text-pn-steel">{user.username}</Link>
          <span>›</span>
          <span className="text-pn-steel font-semibold">Followers &amp; Following</span>
        </div>

        <div className="bg-pn-white border border-pn-border rounded-[18px] px-[22px] py-[18px] mb-5 flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-full bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center font-['Cormorant_Garamond',serif] text-[1.3rem] font-bold text-white shrink-0">
            {user.username?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div>
            <div className="font-['Cormorant_Garamond',serif] text-[1.1rem] font-semibold text-pn-navy">{user.username}</div>
            <div className="text-[0.78rem] text-pn-lm">@{user.username}</div>
          </div>
          <div className="ml-auto flex gap-[22px] text-center">
            <div>
              <span className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-bold text-pn-navy block leading-none">{stats.followers}</span>
              <span className="text-[0.68rem] text-pn-lm font-medium uppercase tracking-wide">Followers</span>
            </div>
            <div>
              <span className="font-['Cormorant_Garamond',serif] text-[1.25rem] font-bold text-pn-navy block leading-none">{stats.following}</span>
              <span className="text-[0.68rem] text-pn-lm font-medium uppercase tracking-wide">Following</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 bg-pn-white border border-pn-border rounded-[13px] p-1 mb-[18px]">
          <button onClick={() => setTab("followers")}
            className={`flex-1 px-[10px] py-[10px] rounded-[9px] text-[0.875rem] font-semibold text-center cursor-pointer transition-colors ${
              tab === "followers" ? "bg-pn-steel text-white" : "text-pn-muted"
            }`}>
            Followers ({stats.followers})
          </button>
          <button onClick={() => setTab("following")}
            className={`flex-1 px-[10px] py-[10px] rounded-[9px] text-[0.875rem] font-semibold text-center cursor-pointer transition-colors ${
              tab === "following" ? "bg-pn-steel text-white" : "text-pn-muted"
            }`}>
            Following ({stats.following})
          </button>
        </div>

        <div className="relative mb-[14px]">
          <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-pn-lm">⌕</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-[14px] py-[10px] bg-pn-white border border-pn-border rounded-xl text-[0.875rem] text-pn-navy outline-none focus:border-pn-sky transition-colors"
            placeholder={`Search ${tab}...`} />
        </div>

        <div className="text-[0.72rem] font-bold text-pn-lm uppercase tracking-wider mb-2 px-1">
          {tab === "followers" ? "Followers — you can remove people from this list" : "Following — unfollow to stop seeing their posts"}
        </div>

        {loading && (
          <div className="text-center py-12 text-pn-muted">
            <p className="text-sm">Loading…</p>
          </div>
        )}

        {!loading && filtered.map((u, i) => (
          <div key={u.id}
            className="bg-pn-white border border-pn-border rounded-[15px] px-[18px] py-[14px] mb-[9px] flex items-center gap-[14px] hover:shadow-[0_4px_14px_rgba(53,88,114,0.07)] hover:border-[#D4E2ED] transition-all">
            <Link to={`/profile/${u.id}`}
              className={`w-[44px] h-[44px] rounded-full shrink-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} flex items-center justify-center text-[0.95rem] font-bold text-white`}>
              {u.username?.charAt(0)?.toUpperCase() ?? "U"}
            </Link>
            <div className="flex-1 min-w-0">
              <Link to={`/profile/${u.id}`} className="text-[0.92rem] font-semibold text-pn-navy truncate block">{u.username}</Link>
              <div className="text-[0.75rem] text-pn-lm">@{u.username}</div>
            </div>
            <div className="flex gap-[7px] items-center shrink-0">
              {tab === "followers" && (
                <button onClick={() => handleRemoveFollower(u.id)}
                  className="text-[0.78rem] font-semibold text-pn-lm bg-pn-white border border-pn-border px-3 py-[6px] rounded-lg hover:border-[rgba(180,60,60,0.3)] hover:text-[#9B3A3A] cursor-pointer">Remove</button>
              )}
              {tab === "following" && (
                <button onClick={() => handleUnfollow(u.id)}
                  className="text-[0.8rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.08)] border border-[rgba(180,60,60,0.2)] px-[14px] py-[6px] rounded-lg hover:bg-[rgba(180,60,60,0.14)] cursor-pointer">Unfollow</button>
              )}
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-16 text-pn-muted">
            <p className="text-sm">{search ? "No matches." : tab === "followers" ? "No followers yet." : "Not following anyone yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
