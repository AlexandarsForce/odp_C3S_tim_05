import { Link } from "react-router-dom";

export function LockBanner() {
  return (
    <div className="bg-[rgba(53,88,114,0.06)] border border-[rgba(53,88,114,0.14)] rounded-[14px] px-[18px] py-[14px] mb-5 flex items-center gap-3">
      <span className="text-[1.1rem] shrink-0">🔒</span>
      <span className="text-[0.85rem] text-pn-muted leading-[1.5]">
        You're viewing a public preview of this profile. <Link to="/login" className="text-pn-steel font-semibold">Sign in</Link> or <Link to="/register" className="text-pn-steel font-semibold">create a free account</Link> to see followers, following, and interact with posts.
      </span>
    </div>
  );
}
