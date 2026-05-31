import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { UserFollowerDto } from "../../DTOs/users/UserFollowerDto";

export type FollowUserResult =
    | { success: true }
    | { success: false; reason: 'SELF_FOLLOW' | 'ALREADY_FOLLOWING' | 'ERROR' };

export interface IUserFollowerService {
    followUser(followerId: number, followedId: number): Promise<FollowUserResult>;

    getFollowers(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>>;
    getFollowing(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>>;

    unfollowUser(followerId: number, followedId: number): Promise<boolean>;
}
