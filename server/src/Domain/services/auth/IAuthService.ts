import { AuthUserDto } from "../../DTOs/auth/AuthUserDto";

export interface IAuthService {
  login(username: string, password: string): Promise<AuthUserDto>;
  register(username: string, fullname: string, email: string, password: string, bio: string, profilePicture: string, role: string): Promise<AuthUserDto>;
}
