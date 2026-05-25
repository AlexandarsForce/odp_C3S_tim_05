import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { UserFollowerDto } from "../../DTOs/users/UserFollowerDto";

export interface IUserFollowerService {
    followUser(followerId: number, followedId: number): Promise<boolean>;

    getFollowers(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>>;
    getFollowing(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>>;

    unfollowUser(followerId: number, followedId: number): Promise<boolean>;
}