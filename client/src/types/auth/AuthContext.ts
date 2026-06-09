import type { AuthUser } from "./AuthUser";

export type AuthContextType = {
  user?: AuthUser;
  token: string;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
};
