import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

const navLinks = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/communities", label: "Communities" },
  { to: "/admin/audit", label: "Audit Log" },
  { to: "/admin/health", label: "Health" },
  { to: "/admin/tags", label: "Tags" },
];

export function AdminNavbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-200 bg-[rgba(247,248,240,0.94)] backdrop-blur-[14px] border-b border-pn-border px-7">
      <div className="max-w-[1280px] mx-auto h-[62px] flex items-center justify-between gap-5">
        <div className="flex items-center gap-7">
          <Link to="/admin" className="font-['Cormorant_Garamond',serif] text-[1.3rem] font-semibold text-pn-steel flex items-center gap-2">
            Pulse<span className="text-pn-sky">Net</span>
            <em className="not-italic text-[0.62rem] font-bold tracking-[0.1em] uppercase text-pn-admin bg-[rgba(44,74,62,0.1)] border border-[rgba(44,74,62,0.22)] px-2 py-[3px] rounded-[5px]">Admin</em>
          </Link>
          <nav className="flex gap-[2px] max-md:hidden">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to}
                className={`text-[0.85rem] font-medium px-3 py-[6px] rounded-lg transition-colors ${
                  pathname === l.to ? "text-pn-steel font-semibold bg-[rgba(53,88,114,0.1)]" : "text-pn-muted hover:text-pn-steel hover:bg-[rgba(53,88,114,0.07)]"
                }`}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-[10px] bg-pn-white border border-pn-border rounded-full py-[5px] pl-[5px] pr-[14px]">
          <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-pn-sky to-pn-steel flex items-center justify-center text-[0.8rem] font-bold text-white">
            {user?.username?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div>
            <div className="text-[0.82rem] font-semibold text-pn-navy">{user?.username ?? "admin"}</div>
            <div className="text-[0.62rem] font-bold tracking-[0.06em] uppercase text-pn-admin">Administrator</div>
          </div>
        </div>
      </div>
    </nav>
  );
}
