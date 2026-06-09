import { useContext } from "react";
import AuthContext from "../../contexts/auth/AuthContext";
import type { AuthContextType } from "../../types/auth/AuthContext";
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  // Must be used inside <AuthProvider>; ctx is guaranteed present there.
  return ctx!;
};
