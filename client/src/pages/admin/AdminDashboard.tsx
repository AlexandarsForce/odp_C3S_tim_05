import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminStatCard, AdminNavPanel, ActivityRow } from "../../components/admin/AdminStatCard";
import { adminApi } from "../../api_services/admin/AdminAPIService";
import type { AuditDto } from "../../types/admin/AdminTypes";
import type { CommunityDto } from "../../types/community/CommunityTypes";
import type { PostDto } from "../../types/post/PostTypes";

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(date).toLocaleDateString();
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, communities: 0, posts: 0, audits: 0 });
  const [recentCommunities, setRecentCommunities] = useState<CommunityDto[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostDto[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditDto[]>([]);

  useEffect(() => {
    Promise.all([
      adminApi.getAllUsers(1, 1),
      adminApi.getAllCommunities(1, 4),
      adminApi.getAllPosts(1, 3),
      adminApi.getAuditLogs(1, 4),
    ]).then(([usersRes, commRes, postRes, auditRes]) => {
      const u = usersRes.success && usersRes.data ? usersRes.data.total : 0;
      const c = commRes.success && commRes.data ? commRes.data.total : 0;
      const p = postRes.success && postRes.data ? postRes.data.total : 0;
      const a = auditRes.success && auditRes.data ? auditRes.data.total : 0;
      setStats({ users: u, communities: c, posts: p, audits: a });

      if (commRes.success && commRes.data) setRecentCommunities(commRes.data.items);
      if (postRes.success && postRes.data) setRecentPosts(postRes.data.items);
      if (auditRes.success && auditRes.data) setRecentAudits(auditRes.data.items);
    });
  }, []);

  const handleDeletePost = async (id: number) => {
    await adminApi.deletePost(id);
    const r = await adminApi.getAllPosts(1, 3);
    if (r.success && r.data) setRecentPosts(r.data.items);
  };

  return (
    <AdminLayout>
      <div className="mb-7">
        <div className="flex items-center gap-[6px] text-[0.78rem] text-pn-lm mb-[10px]">
          <Link to="/admin" className="text-pn-lm hover:text-pn-steel">Admin</Link>
          <span>›</span>
          <span className="text-pn-steel font-semibold">Dashboard</span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-pn-navy mb-1">Dashboard</h1>
        <p className="text-[0.875rem] text-pn-muted">System overview and moderation tools for PulseNet.</p>
      </div>

      <div className="grid grid-cols-4 gap-[14px] mb-6 max-md:grid-cols-2">
        <AdminStatCard label="Total Users" value={stats.users.toLocaleString()} />
        <AdminStatCard label="Communities" value={stats.communities.toLocaleString()} />
        <AdminStatCard label="Total Posts" value={stats.posts.toLocaleString()} />
        <AdminStatCard label="Audit Entries" value={stats.audits.toLocaleString()} />
      </div>

      <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[14px]">Admin Sections</div>
      <div className="grid grid-cols-2 gap-[14px] mb-7 max-md:grid-cols-1">
        <AdminNavPanel icon="👤" title="Users" sub="View all registered users, manage roles and delete accounts." to="/admin/users" />
        <AdminNavPanel icon="🏛" title="Communities" sub="View and moderate all communities in the system." to="/admin/communities" />
        <AdminNavPanel icon="📋" title="Audit Log" sub="Chronological log of all admin and user system events." to="/admin/audit" />
        <AdminNavPanel icon="❤" title="Health Dashboard" sub="Real-time status of Master and Slave database nodes." to="/admin/health" />
        <AdminNavPanel icon="🏷" title="Tag Management" sub="Create and manage global tags available to all users." to="/admin/tags" />
      </div>

      <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[14px] flex items-center justify-between">
        Recent Communities
        <Link to="/admin/communities" className="font-['DM_Sans',sans-serif] text-[0.8rem] font-semibold text-pn-steel hover:underline">View all →</Link>
      </div>
      <div className="bg-pn-white border border-pn-border rounded-[20px] p-[22px] mb-[18px]">
        {recentCommunities.length === 0 ? (
          <div className="text-center py-6 text-[0.85rem] text-pn-muted">No communities yet.</div>
        ) : (
          recentCommunities.map((c) => (
            <div key={c.id} className="flex items-center gap-[14px] py-[14px] border-b border-pn-surface last:border-b-0 last:pb-0">
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.95rem] font-bold text-white shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-['Cormorant_Garamond',serif] text-[1rem] font-semibold text-pn-navy truncate">{c.name}</div>
                <div className="text-[0.75rem] text-pn-lm mt-[2px]">
                  {c.type === "private" ? "Private" : "Public"} · Created {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </div>
              <Link to={`/community/${c.id}`}
                className="text-[0.78rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.18)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(53,88,114,0.15)] transition-colors">View →</Link>
            </div>
          ))
        )}
      </div>

      <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[14px]">Recent Posts</div>
      <div className="bg-pn-white border border-pn-border rounded-[20px] overflow-hidden mb-[18px]">
        {recentPosts.length === 0 ? (
          <div className="text-center py-6 text-[0.85rem] text-pn-muted">No posts yet.</div>
        ) : (
          <table className="w-full border-collapse text-[0.875rem]">
            <thead>
              <tr className="border-b border-pn-border">
                {["Post", "Author", "Community", "Posted", "Actions"].map((c) => (
                  <th key={c} className="text-left px-4 py-3 text-[0.72rem] font-bold tracking-[0.09em] uppercase text-pn-lm">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPosts.map((p) => (
                <tr key={p.id} className="border-b border-pn-surface last:border-b-0 hover:bg-[rgba(53,88,114,0.025)]">
                  <td className="px-4 py-3 max-w-[260px]">
                    <Link to={`/posts/${p.id}`} className="font-semibold truncate text-pn-navy hover:text-pn-steel block">{p.title}</Link>
                  </td>
                  <td className="px-4 py-3 text-pn-muted">{p.authorUsername ?? `#${p.authorId}`}</td>
                  <td className="px-4 py-3 text-pn-muted">{p.communityName ?? `#${p.communityId}`}</td>
                  <td className="px-4 py-3 text-[0.8rem] text-pn-lm">{timeAgo(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDeletePost(p.id)} className="text-[0.78rem] font-semibold text-pn-red bg-[rgba(180,60,60,0.08)] border border-[rgba(180,60,60,0.18)] px-3 py-[5px] rounded-[7px] hover:bg-[rgba(180,60,60,0.15)] transition-colors cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[14px] flex items-center justify-between">
        Recent Activity
        <Link to="/admin/audit" className="font-['DM_Sans',sans-serif] text-[0.8rem] font-semibold text-pn-steel hover:underline">Full log →</Link>
      </div>
      <div className="bg-pn-white border border-pn-border rounded-[20px] p-[22px]">
        {recentAudits.length === 0 ? (
          <div className="text-center py-6 text-[0.85rem] text-pn-muted">No activity recorded yet.</div>
        ) : (
          recentAudits.map((a) => (
            <ActivityRow
              key={a.id}
              icon="📋"
              text={a.action}
              actor={a.username ?? `user #${a.userId ?? "?"}`}
              target={a.details ?? ""}
              time={timeAgo(a.createdAt)}
            />
          ))
        )}
      </div>
    </AdminLayout>
  );
}
