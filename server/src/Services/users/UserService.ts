import { IUserService } from "../../Domain/services/users/IUserService";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { UserDto } from "../../Domain/DTOs/users/UserDto";
import { UpdateUserDto } from "../../Domain/DTOs/users/UpdateUserDto";
import { User } from "../../Domain/models/User";
import { UserRole } from "../../Domain/enums/UserRole";

export class UserService implements IUserService {
  public constructor(private readonly userRepo: IUserRepository) {}

  async getAll(): Promise<UserDto[]> {
    const users = await this.userRepo.findAll();
    return users.map((u) => new UserDto(u.id, u.username, u.fullname, u.email, u.bio, u.profilePicture, u.role, u.createdAt, u.updatedAt, u.isActive));
  }

  async getById(id: number): Promise<UserDto> {
    const u = await this.userRepo.findById(id);
    if (u.id === 0) return new UserDto();
    return new UserDto(u.id, u.username, u.fullname, u.email, u.bio, u.profilePicture, u.role, u.createdAt, u.updatedAt, u.isActive);
  }

  async findByUsername(username: string): Promise<UserDto> {
    const u = await this.userRepo.findByUsername(username);
    return new UserDto(u.id, u.username, u.fullname, u.email, u.bio, u.profilePicture, u.role, u.createdAt, u.updatedAt, u.isActive);
  }

  async updateUserRole(id: number, role: UserRole): Promise<boolean> {
    const existingUser = await this.userRepo.findById(id);
    if (existingUser.id === 0) return false;
    existingUser.role = role;
    return this.userRepo.update(existingUser);
  }

  async updateUser(id: number, updateDto: UpdateUserDto): Promise<boolean> {
    const existingUser = await this.userRepo.findById(id);
    if (existingUser.id === 0) return false;
    const updatedUser = new User(
      existingUser.id,
      updateDto.username,
      updateDto.fullname,
      updateDto.email,
      existingUser.passwordHash,
      updateDto.bio,
      updateDto.profilePicture,
      updateDto.role,
      existingUser.createdAt,
      new Date(),
      existingUser.isActive
    );
    return this.userRepo.update(updatedUser);
  }

  async deactivate(id: number): Promise<boolean> {
    return this.userRepo.deactivate(id);
  }
}
