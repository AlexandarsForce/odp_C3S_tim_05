import { NavLink, Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

export function AppNavbar() {
  const { user } = useAuth();

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-[0.875rem] font-medium px-3 py-[6px] rounded-lg transition-colors ${
      isActive ? "font-semibold text-pn-steel bg-[rgba(53,88,114,0.09)]" : "text-pn-muted hover:text-pn-steel"
    }`;

  return (
    <nav className="sticky top-0 z-100 bg-[rgba(247,248,240,0.93)] backdrop-blur-[14px] border-b border-pn-border px-6">
      <div className="max-w-[1120px] mx-auto h-[62px] flex items-center justify-between gap-4">
        <Link to="/dashboard" className="font-['Cormorant_Garamond',serif] text-[1.28rem] font-semibold text-pn-steel shrink-0">
          Pulse<span className="text-pn-sky">Net</span>
        </Link>

        <div className="flex gap-1 items-center">
          <NavLink to="/feed" className={linkCls}>Feed</NavLink>
          <NavLink to="/my-communities" className={linkCls}>Communities</NavLink>
          <NavLink to="/explore" className={linkCls}>Explore</NavLink>
          <NavLink to="/posts/new"
            className="flex items-center gap-[6px] text-[0.875rem] font-semibold text-white bg-pn-navy px-[14px] py-[6px] rounded-lg hover:bg-[#1A2733] transition-colors ml-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create
          </NavLink>
        </div>

        <Link to="/profile/me"
          className="flex items-center gap-[9px] bg-pn-white border border-pn-border rounded-full pr-[14px] pl-1 py-1 shrink-0 hover:border-pn-sky transition-colors">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.8rem] font-bold text-white">
            {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <span className="text-[0.82rem] font-semibold text-pn-navy">{user?.username ?? "user"}</span>
        </Link>
      </div>
    </nav>
  );
}
