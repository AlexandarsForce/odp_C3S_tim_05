import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Building2, FileText, ClipboardList, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { AdminStatCard, ActivityRow } from "../../components/admin/AdminStatCard";
import { useAuth } from "../../hooks/auth/useAuthHook";
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

function PanelEmptyState({
  Icon,
  iconBgClass,
  iconColorClass,
  title,
  subtitle,
  ctaLabel,
  ctaTo,
}: {
  Icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaTo: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 select-none">
      {/* Halo + icon */}
      <div className="relative flex items-center justify-center mb-6">
        {/* Outer halo ring */}
        <div
          className={`absolute rounded-full ${iconBgClass}`}
          style={{ width: "6rem", height: "6rem", opacity: 0.25 }}
        />
        {/* Mid halo ring */}
        <div
          className={`absolute rounded-full ${iconBgClass}`}
          style={{ width: "4.5rem", height: "4.5rem", opacity: 0.4 }}
        />
        {/* Icon box */}
        <div
          className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgClass} shadow-sm`}
          style={{ opacity: 1 }}
        >
          <Icon className={`h-6 w-6 ${iconColorClass}`} />
        </div>
      </div>

      <h3 className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-navy mb-[6px]">
        {title}
      </h3>
      <p className="text-[0.82rem] text-pn-muted leading-[1.65] max-w-[240px] text-center mb-6">
        {subtitle}
      </p>
      <Link
        to={ctaTo}
        className="inline-flex items-center gap-2 text-[0.82rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.07)] border border-[rgba(53,88,114,0.18)] px-4 py-2 rounded-[10px] hover:bg-[rgba(53,88,114,0.13)] transition-colors cursor-pointer"
      >
        {ctaLabel}
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

type TabId = "communities" | "posts" | "activity";

const TABS: {
  id: TabId;
  label: string;
  to: string;
  activeText: string;
  activeBg: string;
  underline: string;
}[] = [
  {
    id: "communities",
    label: "Communities",
    to: "/admin/communities",
    activeText: "text-[#7c6fc4]",
    activeBg: "bg-[rgba(124,111,196,0.1)]",
    underline: "bg-[#7c6fc4]",
  },
  {
    id: "posts",
    label: "Posts",
    to: "/admin/posts",
    activeText: "text-pn-green",
    activeBg: "bg-[rgba(74,174,104,0.1)]",
    underline: "bg-pn-green",
  },
  {
    id: "activity",
    label: "Activity",
    to: "/admin/audit",
    activeText: "text-[#d97706]",
    activeBg: "bg-[rgba(217,119,6,0.1)]",
    underline: "bg-[#d97706]",
  },
];

const greet = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ users: 0, communities: 0, posts: 0, audits: 0 });
  const [recentCommunities, setRecentCommunities] = useState<CommunityDto[]>([]);
  const [recentPosts, setRecentPosts] = useState<PostDto[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("communities");

  useEffect(() => {
    Promise.all([
      adminApi.getAllUsers(1, 1),
      adminApi.getAllCommunities(1, 5),
      adminApi.getAllPosts(1, 5),
      adminApi.getAuditLogs(1, 5),
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
    const r = await adminApi.getAllPosts(1, 5);
    if (r.success && r.data) setRecentPosts(r.data.items);
  };

  const activeTabMeta = TABS.find((t) => t.id === activeTab)!;

  return (
    <AdminLayout>
      <div className="mb-7">
        <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.35rem,2.2vw,1.7rem)] font-bold text-pn-navy mb-[3px]">
          {greet()},{" "}
          <span className="text-pn-steel">{user?.username ?? "admin"}</span>
        </h1>
        <p className="text-[0.875rem] italic text-pn-muted">
          PulseNet is yours to shape — keep communities healthy and the pulse strong.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 max-md:grid-cols-2">
        <AdminStatCard
          label="Total Users"
          value={stats.users.toLocaleString()}
          Icon={Users}
          iconBgClass="bg-[rgba(125,211,252,0.18)]"
          iconColorClass="text-pn-sky"
          labelColorClass="text-[rgba(87,178,214,0.7)]"
          glowColor="rgb(125,211,252)"
        />
        <AdminStatCard
          label="Communities"
          value={stats.communities.toLocaleString()}
          Icon={Building2}
          iconBgClass="bg-[rgba(124,111,196,0.15)]"
          iconColorClass="text-[#7c6fc4]"
          labelColorClass="text-[rgba(124,111,196,0.7)]"
          glowColor="rgb(124,111,196)"
        />
        <AdminStatCard
          label="Total Posts"
          value={stats.posts.toLocaleString()}
          Icon={FileText}
          iconBgClass="bg-[rgba(74,174,104,0.15)]"
          iconColorClass="text-pn-green"
          labelColorClass="text-[rgba(74,174,104,0.7)]"
          glowColor="rgb(74,174,104)"
        />
        <AdminStatCard
          label="Audit Entries"
          value={stats.audits.toLocaleString()}
          Icon={ClipboardList}
          iconBgClass="bg-[rgba(217,119,6,0.12)]"
          iconColorClass="text-[#d97706]"
          labelColorClass="text-[rgba(217,119,6,0.7)]"
          glowColor="rgb(217,119,6)"
        />
      </div>

      {/* Combined recent panel */}
      <div className="rounded-xl border border-pn-border bg-pn-white shadow-sm">
        {/* Tab header */}
        <div className="flex items-center justify-between border-b border-pn-border px-4">
          <div className="flex items-center gap-1 py-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative text-[0.85rem] px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? `${tab.activeText} ${tab.activeBg} font-bold shadow-[0_1px_2px_rgba(0,0,0,0.04)]`
                      : "text-pn-muted hover:text-pn-steel hover:bg-[rgba(53,88,114,0.05)] font-medium"
                  }`}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className={`absolute left-1/2 -translate-x-1/2 -bottom-[10px] h-[3px] w-8 rounded-t-full ${tab.underline}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {activeTab !== "posts" && (
            <Link
              to={activeTabMeta.to}
              className="inline-flex items-center h-9 px-4 py-2 rounded-lg text-sm font-medium text-pn-navy bg-pn-surface border border-pn-border shadow-sm shadow-black/5 hover:bg-[rgba(53,88,114,0.08)] hover:border-pn-steel/30 transition-colors cursor-pointer"
            >
              View all
              <ArrowRight
                className="-me-1 ms-2 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden="true"
              />
            </Link>
          )}
        </div>

        {/* Tab content */}
        <div className="p-6">

          {/* Communities tab */}
          {activeTab === "communities" && (
            <>
              {recentCommunities.length === 0 ? (
                <PanelEmptyState
                  Icon={Building2}
                  iconBgClass="bg-[rgba(124,111,196,0.15)]"
                  iconColorClass="text-[#7c6fc4]"
                  title="No communities yet"
                  subtitle="Communities created by users will appear here once they become active."
                  ctaLabel="Browse all communities"
                  ctaTo="/admin/communities"
                />
              ) : (
                <div className="space-y-1">
                  {recentCommunities.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-[rgba(53,88,114,0.03)] transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#9b8ed6] to-[#7c6fc4] flex items-center justify-center text-sm font-bold text-white shrink-0">
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.875rem] font-medium text-pn-navy truncate">{c.name}</p>
                        <p className="text-xs text-pn-lm mt-[1px]">
                          {c.type === "private" ? "Private" : "Public"} · {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Link
                        to={`/community/${c.id}`}
                        className="text-xs font-semibold text-pn-steel bg-[rgba(53,88,114,0.07)] border border-[rgba(53,88,114,0.15)] px-3 py-1.5 rounded-lg hover:bg-[rgba(53,88,114,0.14)] transition-colors cursor-pointer shrink-0"
                      >
                        View →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Posts tab */}
          {activeTab === "posts" && (
            <>
              {recentPosts.length === 0 ? (
                <PanelEmptyState
                  Icon={FileText}
                  iconBgClass="bg-[rgba(74,174,104,0.15)]"
                  iconColorClass="text-pn-green"
                  title="No posts yet"
                  subtitle="Recent posts from your communities will show up here as they're created."
                  ctaLabel="Browse all posts"
                  ctaTo="/admin/posts"
                />
              ) : (
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-pn-surface">
                      {["Post", "Author", "Community", "Posted", "Actions"].map((col) => (
                        <th
                          key={col}
                          className="text-left pb-3 text-[0.68rem] font-bold tracking-[0.09em] uppercase text-pn-lm pr-4 last:pr-0"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPosts.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-pn-surface last:border-b-0 hover:bg-[rgba(53,88,114,0.025)]"
                      >
                        <td className="py-3 pr-4 max-w-[220px]">
                          <Link
                            to={`/posts/${p.id}`}
                            className="font-medium truncate text-pn-navy hover:text-pn-steel block"
                          >
                            {p.title}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-pn-muted text-xs">{p.authorUsername ?? `#${p.authorId}`}</td>
                        <td className="py-3 pr-4 text-pn-muted text-xs">{p.communityName ?? `#${p.communityId}`}</td>
                        <td className="py-3 pr-4 text-xs text-pn-lm whitespace-nowrap">{timeAgo(p.createdAt)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => handleDeletePost(p.id)}
                            className="text-xs font-semibold text-pn-red bg-[rgba(180,60,60,0.07)] border border-[rgba(180,60,60,0.15)] px-3 py-1.5 rounded-lg hover:bg-[rgba(180,60,60,0.14)] transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            <>
              {recentAudits.length === 0 ? (
                <PanelEmptyState
                  Icon={ClipboardList}
                  iconBgClass="bg-[rgba(217,119,6,0.12)]"
                  iconColorClass="text-[#d97706]"
                  title="No activity recorded yet"
                  subtitle="Admin actions and system events will be logged here automatically."
                  ctaLabel="View full audit log"
                  ctaTo="/admin/audit"
                />
              ) : (
                <div className="space-y-1">
                  {recentAudits.map((a) => (
                    <ActivityRow
                      key={a.id}
                      text={a.action}
                      actor={a.username ?? `user #${a.userId ?? "?"}`}
                      target={a.details ?? ""}
                      time={timeAgo(a.createdAt)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}
