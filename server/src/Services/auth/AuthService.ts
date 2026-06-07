import bcrypt from "bcryptjs";
import { IAuthService } from "../../Domain/services/auth/IAuthService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { AuthUserDto } from "../../Domain/DTOs/auth/AuthUserDto";
import { RegisterResult } from "../../Domain/DTOs/auth/RegisterResult";
import { UserRole } from "../../Domain/enums/UserRole";
import { User } from "../../Domain/models/User";

export class AuthService implements IAuthService {
  private readonly saltRounds = parseInt(process.env.SALT_ROUNDS ?? "10", 10);

  public constructor(private readonly userRepo: IUserRepository) {}

  async login(username: string, password: string): Promise<AuthUserDto> {
    const user = await this.userRepo.findByUsername(username);
    if (user.id === 0 || user.isActive === 0) return new AuthUserDto();
    const match = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    if (!match) return new AuthUserDto();
    return new AuthUserDto(user.id, user.username, user.role);
  }

  async register(username: string, fullname: string, email: string, password: string, bio: string, profilePicture: string, role: string): Promise<RegisterResult> {
    const byName = await this.userRepo.findByUsername(username);
    if (byName.id !== 0) return new RegisterResult("username_taken");
    const byEmail = await this.userRepo.findByEmail(email);
    if (byEmail.id !== 0) return new RegisterResult("email_taken");
    const hash = await bcrypt.hash(password, this.saltRounds).catch(() => "");
    if (!hash) return new RegisterResult("hash_failed");
    const userRole = role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.USER;
    const created = await this.userRepo.create(new User(0, username, fullname, email, hash, bio, profilePicture, userRole));
    if (created.id === 0) return new RegisterResult("create_failed");
    return new RegisterResult("ok", new AuthUserDto(created.id, created.username, created.role));
  }
}
