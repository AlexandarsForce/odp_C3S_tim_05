import { UserDto } from "../../DTOs/users/UserDto";
import { UserRole } from "../../enums/UserRole";
import { UpdateUserDto } from "../../DTOs/users/UpdateUserDto";

export interface IUserService {
  getAll(): Promise<UserDto[]>;
  getById(id: number): Promise<UserDto>;
  findByUsername(username: string): Promise<UserDto>;

  updateUserRole(id: number, role: UserRole): Promise<boolean>;
  updateUser(id: number, updateDto: UpdateUserDto): Promise<boolean>;
  adminUpdateUser(id: number, updateDto: UpdateUserDto): Promise<boolean>;

  deactivate(id: number): Promise<boolean>;
  deleteUser(id: number): Promise<boolean>;
}
