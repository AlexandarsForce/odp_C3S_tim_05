import { UserFollower } from "../../models/UserFollower";

export interface IUserFollowerRepository {
    addFollower(userId: number, followerId: number): Promise<boolean>;
    isFollowing(userId: number, followerId: number): Promise<boolean>;

    findAllFollowers(userId: number, page: number, limit: number): Promise<{ followers: UserFollower[], totalAmount: number }>;
    findAllFollowing(userId: number, page: number, limit: number): Promise<{ following: UserFollower[], totalAmount: number }>;

    deleteFollower(userId: number, followerId: number): Promise<boolean>;
    deleteFollowing(userId: number, followingId: number): Promise<boolean>;
}