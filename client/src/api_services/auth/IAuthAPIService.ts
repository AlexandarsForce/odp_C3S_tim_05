import type { AuthResponse } from "../../types/auth/AuthResponse";

export interface IAuthAPIService {
  login(username: string, password: string): Promise<AuthResponse>;
  register(username: string, fullname: string, email: string, password: string, bio: string, profilePicture: string, role: string): Promise<AuthResponse>;
  logout(token: string): Promise<void>;
}
