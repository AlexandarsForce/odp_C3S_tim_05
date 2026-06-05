import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

export function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `text-[0.875rem] font-medium px-3 py-[6px] rounded-lg transition-colors ${
      isActive ? "font-semibold text-pn-steel bg-[rgba(53,88,114,0.09)]" : "text-pn-muted hover:text-pn-steel"
    }`;

  const menuItemCls =
    "flex items-center gap-[10px] w-full text-left px-3 py-[7px] text-[0.83rem] text-pn-navy hover:bg-[rgba(122,170,206,0.12)] transition-colors";

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
          <NavLink to="/feed" className={linkCls}>Feed</NavLink>
          <NavLink to="/my-communities" className={linkCls}>Communities</NavLink>
          <NavLink to="/explore" className={linkCls}>Explore</NavLink>
          <NavLink to="/posts/new"
            className="flex items-center gap-[6px] text-[0.875rem] font-semibold text-white bg-pn-sky px-[14px] py-[6px] rounded-lg hover:bg-pn-steel transition-colors ml-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Create
          </NavLink>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className={`inline-flex items-center gap-[9px] bg-pn-white border rounded-full pr-[12px] pl-[3px] py-[3px] transition-all duration-200 ${
              menuOpen
                ? "border-pn-sky shadow-[0_4px_14px_rgba(122,170,206,0.22)]"
                : "border-pn-border hover:border-pn-sky"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.78rem] font-bold text-white shrink-0">
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <span className="text-[0.82rem] font-semibold text-pn-navy truncate max-w-[140px]">{user?.username ?? "user"}</span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`text-pn-muted shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${menuOpen ? "rotate-180" : ""}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <div
            role="menu"
            aria-hidden={!menuOpen}
            className={`absolute top-full right-0 w-[210px] mt-[8px] bg-pn-white border border-pn-border rounded-xl shadow-[0_14px_36px_rgba(53,88,114,0.16)] overflow-hidden origin-top-right transition-all duration-200 ease-out ${
              menuOpen
                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
            }`}
          >
            <div className="flex items-center gap-[10px] px-3 pt-3 pb-[10px] border-b border-pn-border bg-[rgba(247,248,240,0.55)]">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.78rem] font-bold text-white shrink-0">
                {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[0.82rem] font-semibold text-pn-navy truncate leading-tight">{user?.username ?? "user"}</div>
                <div className="text-[0.68rem] text-pn-lm capitalize leading-tight mt-[2px]">{user?.role ?? "member"}</div>
              </div>
            </div>

            <div className="py-[5px]">
              <Link to="/profile/me" onClick={() => setMenuOpen(false)} className={menuItemCls}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pn-lm shrink-0">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                My profile
              </Link>
              <Link to="/settings" onClick={() => setMenuOpen(false)} className={menuItemCls}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pn-lm shrink-0">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Settings
              </Link>
              <div className="border-t border-pn-border my-[5px]" />
              <button type="button" onClick={handleSignOut} className={`${menuItemCls} text-pn-red hover:bg-[rgba(155,58,58,0.08)]`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-80">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
