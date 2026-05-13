import { User } from "../../models/User";
import { UserFollower } from "../../models/UserFollower";

export interface IUserRepository {
  create(user: User): Promise<User>;
  addFollower(userId: number, followerId: number): Promise<boolean>;

  findById(id: number): Promise<User>;
  findByUsername(username: string): Promise<User>;
  findByEmail(email: string): Promise<User>;
  findAll(): Promise<User[]>;
  findAllFollowers(userId: number): Promise<{ followers: UserFollower[], totalAmount: number }>;
  findAllFollowing(userId: number): Promise<{ following: UserFollower[], totalAmount: number }>;

  update(user: User): Promise<boolean>;

  delete(id: number): Promise<boolean>;
  deleteFollower(userId: number, followerId: number): Promise<boolean>;
  deleteFollowing(userId: number, followingId: number): Promise<boolean>;
  deactivate(id: number): Promise<boolean>;
}
