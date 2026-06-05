import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";

export function PublicNavbar() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <nav className="sticky top-0 z-100 bg-[rgba(247,248,240,0.93)] backdrop-blur-[14px] border-b border-pn-border px-6">
      <div className="max-w-[1120px] mx-auto h-[62px] flex items-center justify-between gap-4">
        <Link to={isAuthenticated ? dashboardPath : "/"} className="font-['Cormorant_Garamond',serif] text-[1.28rem] font-semibold text-pn-steel">
          Pulse<span className="text-pn-sky">Net</span>
        </Link>
        <div className="flex gap-2 items-center">
          {isAuthenticated ? (
            <Link to={dashboardPath} className="text-[0.875rem] font-semibold text-white bg-pn-steel px-[18px] py-[8px] rounded-lg hover:bg-[#2a4760] transition-colors">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-[0.875rem] font-semibold text-pn-steel bg-pn-white border-[1.5px] border-pn-border px-[18px] py-[8px] rounded-lg hover:border-pn-sky transition-colors">
                Log In
              </Link>
              <Link to="/register" className="text-[0.875rem] font-semibold text-white bg-pn-steel px-[18px] py-[8px] rounded-lg hover:bg-[#2a4760] transition-colors">
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
