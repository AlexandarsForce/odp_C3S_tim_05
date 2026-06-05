import type { CommunityDto } from "../../types/community/CommunityTypes";

export function CommunityHeader({ community, memberCount, postCount }: { community?: CommunityDto; memberCount?: number; postCount?: number }) {
  return (
    <div className="bg-pn-white border border-pn-border rounded-2xl overflow-hidden mb-5 shadow-[0_8px_28px_rgba(53,88,114,0.07)]">
      <div className="h-[90px] bg-gradient-to-r from-[#2C3E4F] via-pn-steel to-pn-sky" />
      <div className="px-[26px] pb-6">
        <div className="-mt-8 mb-[14px] flex items-end justify-between flex-wrap gap-[10px]">
          <div className="w-16 h-16 rounded-[16px] bg-gradient-to-br from-pn-sky to-pn-steel border-[3px] border-pn-white flex items-center justify-center font-['Cormorant_Garamond',serif] text-[1.7rem] font-bold text-white shadow-[0_3px_12px_rgba(53,88,114,0.18)]">
            {community?.name?.charAt(0) ?? "D"}
          </div>
          <span className="text-[0.72rem] font-bold text-pn-steel bg-[rgba(53,88,114,0.09)] border border-[rgba(53,88,114,0.2)] px-3 py-[4px] rounded-lg">
            Public Community
          </span>
        </div>
        <h1 className="font-['Cormorant_Garamond',serif] text-[1.6rem] font-bold text-pn-navy mb-1">
          {community?.name ?? "Design Systems"}
        </h1>
        <p className="text-[0.875rem] text-pn-muted leading-[1.65] mb-[14px]">
          {community?.description ?? "A dedicated space for designers, engineers, and product thinkers working on or curious about design systems — tokens, component libraries, documentation, and governance at scale."}
        </p>
        <div className="flex gap-[18px] flex-wrap">
          <span className="text-[0.78rem] text-pn-lm font-medium"><strong className="text-pn-navy">{memberCount?.toLocaleString() ?? "2,341"}</strong> members</span>
          <span className="text-[0.78rem] text-pn-lm font-medium"><strong className="text-pn-navy">{postCount?.toLocaleString() ?? "1,048"}</strong> posts</span>
          <span className="text-[0.78rem] text-pn-lm font-medium">Founded <strong className="text-pn-navy">{community?.createdAt ? new Date(community.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short" }) : "Nov 2023"}</strong></span>
          <span className="text-[0.78rem] text-pn-lm font-medium" style={{ color: "#2C7A4B" }}>● Very Active</span>
        </div>
      </div>
    </div>
  );
}
