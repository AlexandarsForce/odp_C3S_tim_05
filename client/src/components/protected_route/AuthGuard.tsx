import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/auth/useAuthHook";
import { Spinner } from "../ui/UI";

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return (
    <div className="min-h-screen bg-pn-bg flex items-center justify-center">
      <Spinner size={24} />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;

  return <>{children}</>;
};
