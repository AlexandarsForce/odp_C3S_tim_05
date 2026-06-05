import React from "react";
import { Navigate, useLocation, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { Spinner } from "../ui/UI";

export const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole: string }> = ({ children, requiredRole }) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (isLoading) return (
    <div className="min-h-screen bg-pn-bg flex items-center justify-center">
      <Spinner size={24} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };

  if (user?.role !== requiredRole) return (
    <div className="min-h-screen bg-pn-bg font-['DM_Sans',sans-serif] text-pn-navy flex flex-col">

      <nav className="bg-[rgba(247,248,240,0.93)] backdrop-blur-[14px] border-b border-pn-border px-10 h-[62px] flex items-center justify-between">
        <Link to="/" className="font-['Cormorant_Garamond',serif] text-[1.28rem] font-semibold text-pn-steel">
          Pulse<span className="text-pn-sky">Net</span>
        </Link>
        <div className="flex gap-7">
          <Link to="/feed" className="text-[0.875rem] font-medium text-pn-muted hover:text-pn-steel transition-colors">Feed</Link>
          <Link to="/my-communities" className="text-[0.875rem] font-medium text-pn-muted hover:text-pn-steel transition-colors">Communities</Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="bg-pn-white border border-pn-border rounded-[22px] px-[52px] pt-[56px] pb-[48px] max-w-[540px] w-full text-center shadow-[0_16px_48px_rgba(53,88,114,0.09)]">

          <div className="inline-flex items-center gap-2 bg-pn-bg border border-pn-border rounded-full px-4 py-[6px] text-[0.72rem] font-bold tracking-[0.12em] uppercase text-pn-steel mb-7">
            <span className="w-2 h-2 rounded-full bg-pn-steel" />
            Restricted Area
          </div>

          <h1 className="font-['Cormorant_Garamond',serif] text-[clamp(1.8rem,4vw,2.4rem)] font-bold text-pn-navy leading-[1.18] mb-4">
            You don't have permission<br />to access this page.
          </h1>

          <p className="text-[0.925rem] leading-[1.72] text-pn-muted max-w-[380px] mx-auto mb-8">
            This space is reserved for authorized members. Sign out to switch accounts, or head back to your dashboard.
          </p>

          <div className="flex gap-[10px] justify-center flex-wrap mb-7">
            <button
              onClick={handleSignOut}
              className="inline-flex items-center justify-center bg-pn-steel text-white font-['DM_Sans',sans-serif] font-semibold text-[0.9rem] px-7 py-3 rounded-[10px] shadow-[0_5px_16px_rgba(53,88,114,0.24)] hover:bg-[#2a4760] hover:-translate-y-px transition-all cursor-pointer"
            >
              Sign out
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center bg-pn-white text-pn-steel font-['DM_Sans',sans-serif] font-semibold text-[0.9rem] px-[26px] py-[11px] rounded-[10px] border-[1.5px] border-pn-border hover:border-pn-sky transition-all"
            >
              Go home
            </Link>
          </div>

          <div className="text-[0.78rem] text-[#8FABD4]">
            Error code · 403 — Forbidden
          </div>

        </div>
      </div>
    </div>
  );

  return <>{children}</>;
};
