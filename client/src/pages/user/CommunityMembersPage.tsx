import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { AppNavbar } from "../../components/layout/AppNavbar";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { communityApi } from "../../api_services/communities/CommunityAPIService";
import type { CommunityMemberDto, CommunityDto } from "../../types/community/CommunityTypes";

const GRADIENTS = [
  "from-pn-sky to-pn-steel",
  "from-pn-pale to-pn-sky",
  "from-pn-steel to-pn-navy",
  "from-pn-lm to-pn-steel",
];

export default function CommunityMembersPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [community, setCommunity] = useState<CommunityDto | null>(null);
  const [allMembers, setAllMembers] = useState<CommunityMemberDto[]>([]);
  const [tab, setTab] = useState<"members" | "requests">("members");
  const [respondingTo, setRespondingTo] = useState<number | null>(null);

  const fetchData = () => {
    if (!id) return;
    communityApi.getById(Number(id), 20).then((r) => {
      if (r.success && r.data) {
        setCommunity(r.data);
        if (r.members) setAllMembers(r.members.items);
      }
    });
  };

  useEffect(fetchData, [id]);

  const activeMembers = allMembers.filter((m) => m.status === "active");
  const pendingRequests = allMembers.filter((m) => m.status === "pending");

  const isMod = activeMembers.some((m) => m.userId === user?.id && m.role === "moderator");

  const handleRoleChange = async (userId: number, role: string) => {
    if (!id) return;
    await communityApi.updateMemberRole(Number(id), userId, role);
    setAllMembers((prev) => prev.map((m) => (m.userId === userId ? { ...m, role } : m)));
  };

  const handleRemove = async (userId: number) => {
    if (!id) return;
    await communityApi.removeMember(Number(id), userId);
    setAllMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleRequest = async (userId: number, accepted: boolean) => {
    if (!id) return;
    setRespondingTo(userId);
    const res = await communityApi.updateMemberStatus(Number(id), userId, accepted);
    setRespondingTo(null);
    if (res.success) {
      if (accepted) {
        setAllMembers((prev) =>
          prev.map((m) => (m.userId === userId ? { ...m, status: "active", role: "member" } : m))
        );
      } else {
        setAllMembers((prev) => prev.filter((m) => m.userId !== userId));
      }
    }
  };

  return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy">
      <AppNavbar />

      <main className="max-w-[860px] mx-auto px-6 py-10 pb-20">
        <div className="flex items-center gap-2 text-[0.82rem] mb-5">
          <Link to={`/community/${id}`} className="text-pn-lm hover:text-pn-steel transition-colors">{community?.name ?? "Community"}</Link>
          <span className="text-pn-border">&rsaquo;</span>
          <span className="text-pn-steel font-semibold">Members</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap mb-6">
          <h1 className="font-['Cormorant_Garamond',serif] text-[1.75rem] font-bold text-pn-navy leading-tight">
            Members
          </h1>
          {community?.type === "public" && (
            <span className="text-[0.78rem] font-semibold text-pn-steel bg-[rgba(53,88,114,0.08)] border border-[rgba(53,88,114,0.15)] px-3 py-[3px] rounded-full">
              {activeMembers.length}
            </span>
          )}
        </div>

        {community?.type !== "public" && (
          <div className="flex gap-6 border-b border-pn-border mb-6">
            <button onClick={() => setTab("members")}
              className={`pb-3 px-1 text-[0.875rem] font-semibold transition-colors cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
                tab === "members"
                  ? "border-pn-steel text-pn-navy"
                  : "border-transparent text-pn-muted hover:text-pn-steel"
              }`}>
              Members
              <span className={`text-[0.7rem] font-semibold px-[7px] py-[1px] rounded-full ${
                tab === "members"
                  ? "bg-[rgba(53,88,114,0.12)] text-pn-steel"
                  : "bg-pn-bg text-pn-lm"
              }`}>{activeMembers.length}</span>
            </button>
            <button onClick={() => setTab("requests")}
              className={`pb-3 px-1 text-[0.875rem] font-semibold transition-colors cursor-pointer flex items-center gap-2 border-b-2 -mb-px ${
                tab === "requests"
                  ? "border-pn-steel text-pn-navy"
                  : "border-transparent text-pn-muted hover:text-pn-steel"
              }`}>
              Join Requests
              <span className={`text-[0.7rem] font-semibold px-[7px] py-[1px] rounded-full ${
                pendingRequests.length > 0
                  ? "bg-[rgba(192,57,43,0.1)] text-[#c0392b]"
                  : tab === "requests"
                    ? "bg-[rgba(53,88,114,0.12)] text-pn-steel"
                    : "bg-pn-bg text-pn-lm"
              }`}>{pendingRequests.length}</span>
            </button>
          </div>
        )}

        {tab === "members" && (
          <div>
            {activeMembers.map((m, i) => {
              const isOwner = community?.ownerId === m.userId;
              const joined = new Date(m.joinedAt).toLocaleDateString("en-US", { month: "short", year: "numeric" });
              return (
                <div key={m.userId}
                  className="bg-pn-white border border-pn-border rounded-[16px] px-5 py-4 mb-[10px] flex items-center justify-between gap-4 hover:shadow-[0_4px_16px_rgba(53,88,114,0.07)] hover:border-pn-sky transition-all">
                  <Link to={`/profile/${m.userId}`} className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} shrink-0 flex items-center justify-center text-[0.95rem] font-semibold text-white`}>
                      {m.username?.charAt(0)?.toUpperCase() ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[0.95rem] font-semibold text-pn-navy truncate">{m.username || `User #${m.userId}`}</div>
                      <div className="flex items-center gap-[6px] text-[0.76rem] text-pn-lm">
                        <span className="truncate">@{m.username || `user${m.userId}`}</span>
                        <span className="text-pn-border">·</span>
                        <span className="whitespace-nowrap">Joined {joined}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-[10px] shrink-0">
                    {isOwner ? (
                      <span className="text-[0.72rem] font-semibold text-white bg-pn-navy px-[10px] py-[3px] rounded-full">owner</span>
                    ) : m.role === "moderator" ? (
                      <span className="text-[0.72rem] font-semibold text-[#8A6820] bg-[rgba(195,150,40,0.1)] border border-[rgba(195,150,40,0.2)] px-[10px] py-[3px] rounded-full">moderator</span>
                    ) : (
                      <span className="text-[0.72rem] font-medium text-pn-muted bg-pn-bg border border-pn-border px-[10px] py-[3px] rounded-full">member</span>
                    )}
                    {isMod && m.userId !== user?.id && m.role !== "moderator" && !isOwner && (
                      <>
                        <select value={m.role} onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                          className="bg-pn-bg border border-pn-border rounded-lg text-[0.8rem] px-[10px] py-[5px] text-pn-steel outline-none cursor-pointer">
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                        </select>
                        <button onClick={() => handleRemove(m.userId)}
                          aria-label="Remove member"
                          className="w-[30px] h-[30px] rounded-lg bg-[rgba(180,60,60,0.08)] border border-[rgba(180,60,60,0.15)] text-[#9B3A3A] text-[0.85rem] flex items-center justify-center cursor-pointer hover:bg-[rgba(180,60,60,0.15)]">
                          ✕
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {activeMembers.length === 0 && (
              <div className="text-center py-16 text-pn-muted">
                <p>No members found.</p>
              </div>
            )}
          </div>
        )}

        {tab === "requests" && community?.type !== "public" && (
          <div>
            {!isMod && pendingRequests.length > 0 && (
              <div className="bg-[rgba(195,150,40,0.07)] border border-[rgba(195,150,40,0.2)] rounded-[14px] px-5 py-3 mb-4 text-[0.82rem] text-[#8A6820]">
                Only moderators can accept or reject join requests.
              </div>
            )}

            {pendingRequests.map((m, i) => (
              <div key={m.userId}
                className="bg-pn-white border border-pn-border rounded-[16px] px-5 py-4 mb-[10px] flex items-center justify-between gap-4 hover:shadow-[0_4px_16px_rgba(53,88,114,0.07)] hover:border-pn-sky transition-all">
                <Link to={`/profile/${m.userId}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-[42px] h-[42px] rounded-full bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} shrink-0 flex items-center justify-center text-[0.95rem] font-semibold text-white`}>
                    {m.username?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[0.95rem] font-semibold text-pn-navy truncate">{m.username || `User #${m.userId}`}</div>
                    <div className="text-[0.78rem] text-pn-lm">@{m.username || `user${m.userId}`}</div>
                  </div>
                </Link>
                <div className="flex items-center gap-[10px] shrink-0">
                  <span className="text-[0.72rem] font-semibold text-[#c0853c] bg-[rgba(210,160,60,0.1)] border border-[rgba(210,160,60,0.2)] px-[10px] py-[3px] rounded-full">
                    pending
                  </span>
                  {isMod && (
                    <>
                      <button
                        onClick={() => handleRequest(m.userId, true)}
                        disabled={respondingTo === m.userId}
                        className="inline-flex items-center gap-[5px] text-[0.8rem] font-semibold text-white bg-pn-green px-[14px] py-[6px] rounded-lg shadow-[0_3px_10px_rgba(46,139,87,0.2)] hover:bg-[#238a4e] disabled:opacity-50 cursor-pointer transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => handleRequest(m.userId, false)}
                        disabled={respondingTo === m.userId}
                        className="inline-flex items-center gap-[5px] text-[0.8rem] font-semibold text-[#9B3A3A] bg-[rgba(180,60,60,0.08)] px-[14px] py-[6px] rounded-lg border border-[rgba(180,60,60,0.18)] hover:bg-[rgba(180,60,60,0.14)] disabled:opacity-50 cursor-pointer transition-all"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {pendingRequests.length === 0 && (
              <div className="bg-pn-white border border-pn-border rounded-[20px] py-14 text-center">
                <div className="w-12 h-12 rounded-full bg-pn-bg border border-pn-border mx-auto mb-4 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-pn-lm">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="8.5" cy="7" r="4"/>
                    <line x1="20" y1="8" x2="20" y2="14"/>
                    <line x1="23" y1="11" x2="17" y2="11"/>
                  </svg>
                </div>
                <p className="text-[0.95rem] font-semibold text-pn-navy mb-1">No pending requests</p>
                <p className="text-[0.82rem] text-pn-muted">
                  When someone requests to join this community, their request will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
