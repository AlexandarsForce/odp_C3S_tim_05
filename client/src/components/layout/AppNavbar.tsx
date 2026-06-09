import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { CommentAvatar } from "../comments/CommentAvatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

export function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `relative text-[0.875rem] font-medium px-3 py-[6px] rounded-lg transition-colors ${
      isActive ? "font-semibold text-pn-steel" : "text-pn-muted hover:text-pn-steel"
    }`;

  const TubeLight = () => (
    <>
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-[rgba(122,170,206,0.12)] rounded-lg" />
      <span aria-hidden="true" className="absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-7 h-[2px] bg-pn-sky rounded-full">
        <span className="absolute -inset-x-3 -inset-y-[7px] bg-pn-sky opacity-35 rounded-full blur-md" />
        <span className="absolute -inset-x-1 -inset-y-[3px] bg-pn-sky opacity-40 rounded-full blur-sm" />
        <span className="absolute inset-0 bg-pn-pale opacity-90 rounded-full" />
      </span>
    </>
  );

  const itemIconCls = "text-pn-lm shrink-0";

  return (
    <nav className="sticky top-0 z-100 bg-[rgba(245,247,238,0.94)] backdrop-blur-[16px] border-b border-pn-border px-6 shadow-[0_1px_0_rgba(53,88,114,0.03)]">
      <div className="max-w-[1120px] mx-auto h-[62px] flex items-center justify-between gap-4">
        <Link
          to="/dashboard"
          className="group font-['Cormorant_Garamond',serif] text-[1.55rem] font-bold text-pn-steel shrink-0 leading-none tracking-tight inline-flex items-center gap-[7px]"
        >
          <span>
            Pulse<span className="text-pn-sky">Net</span>
          </span>
          <span className="relative inline-flex w-[7px] h-[7px] shrink-0" aria-hidden="true">
            <span className="absolute inset-0 rounded-full bg-pn-sky animate-pulse-dot" />
            <span className="absolute inset-0 rounded-full bg-pn-sky opacity-40 blur-[3px] group-hover:opacity-70 transition-opacity" />
          </span>
        </Link>

        <div className="flex gap-1 items-center">
          <NavLink to="/feed" className={linkCls}>
            {({ isActive }) => (<>Feed{isActive && <TubeLight />}</>)}
          </NavLink>
          <NavLink to="/my-communities" className={linkCls}>
            {({ isActive }) => (<>Communities{isActive && <TubeLight />}</>)}
          </NavLink>
          <NavLink to="/explore" className={linkCls}>
            {({ isActive }) => (<>Explore{isActive && <TubeLight />}</>)}
          </NavLink>
          <NavLink to="/posts/new"
            className="flex items-center gap-[6px] text-[0.875rem] font-semibold text-white bg-pn-sky px-[14px] py-[6px] rounded-lg hover:bg-pn-steel transition-colors ml-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create
          </NavLink>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group inline-flex items-center gap-[9px] bg-pn-white border rounded-full pr-[12px] pl-[3px] py-[3px] border-pn-border hover:border-pn-sky transition-all duration-200 data-[state=open]:border-pn-sky data-[state=open]:shadow-[0_4px_14px_rgba(122,170,206,0.22)]"
            >
              <CommentAvatar
                username={user?.username}
                profilePicture={user?.profilePicture}
                size="sm"
                linkable={false}
              />
              <span className="text-[0.82rem] font-semibold text-pn-navy truncate max-w-[140px]">{user?.username ?? "user"}</span>
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-pn-muted shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-data-[state=open]:rotate-180"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="p-0">
            <div className="flex items-center gap-[10px] px-3 pt-3 pb-[10px] border-b border-pn-border bg-[rgba(247,248,240,0.55)]">
              <CommentAvatar
                username={user?.username}
                profilePicture={user?.profilePicture}
                size="sm"
                linkable={false}
              />
              <div className="min-w-0 flex-1">
                <div className="text-[0.82rem] font-semibold text-pn-navy truncate leading-tight">{user?.username ?? "user"}</div>
                <div className="text-[0.68rem] text-pn-lm capitalize leading-tight mt-[2px]">{user?.role ?? "member"}</div>
              </div>
            </div>

            <div className="py-[5px]">
              <DropdownMenuItem onSelect={() => navigate("/profile/me")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={itemIconCls}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My profile
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/settings")}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={itemIconCls}>
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="text-pn-red focus:bg-[rgba(155,58,58,0.08)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
