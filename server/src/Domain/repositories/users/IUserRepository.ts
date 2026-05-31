import { User } from "../../models/User";

export interface IUserRepository {
  create(user: User): Promise<User>;

  findById(id: number): Promise<User>;
  findByUsername(username: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[]>;

  update(user: User): Promise<boolean>;
  exists(id: number): Promise<boolean>;

  deactivate(id: number): Promise<boolean>;
  delete(id: number): Promise<boolean>;
}
