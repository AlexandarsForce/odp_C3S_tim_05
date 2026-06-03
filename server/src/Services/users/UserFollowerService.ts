import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { IUserFollowerService, FollowUserResult } from "../../Domain/services/users/IUserFollowerService";
import { UserFollowerDto } from "../../Domain/DTOs/users/UserFollowerDto";
import { IUserFollowerRepository } from "../../Domain/repositories/users/IUserFollowerRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class UserFollowerService implements IUserFollowerService {
    public constructor(
        private readonly userFollowerRepository: IUserFollowerRepository,
        private readonly auditService: IAuditService
    ) {}

    async followUser(userId: number, followUserId: number): Promise<FollowUserResult> {
        if (userId === followUserId) {
            return { success: false, reason: 'SELF_FOLLOW' };
        }

        const alreadyFollowing = await this.userFollowerRepository.isFollowing(userId, followUserId);
        if (alreadyFollowing) {
            return { success: false, reason: 'ALREADY_FOLLOWING' };
        }

        const result = await this.userFollowerRepository.addFollower(userId, followUserId);
        if (!result) return { success: false, reason: 'ERROR' };

        await this.auditService.log({ userId, action: "USER_FOLLOWED", details: `Followed user ${followUserId}` });
        return { success: true };
    }

    async getFollowers(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>> {
        const { followers, totalAmount } = await this.userFollowerRepository.findAllFollowers(userId, page, limit);
        const followerDtos = followers.map(f => new UserFollowerDto(f.followingId, f.followerId));
        return new PaginatedListDto<UserFollowerDto>(followerDtos, totalAmount, page, limit);
    }

    async getFollowing(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>> {
        const { following, totalAmount } = await this.userFollowerRepository.findAllFollowing(userId, page, limit);
        const followingDtos = following.map(f => new UserFollowerDto(f.followerId, f.followingId));
        return new PaginatedListDto<UserFollowerDto>(followingDtos, totalAmount, page, limit);
    }

    async unfollowUser(userId: number, unfollowUserId: number): Promise<boolean> {
        const result = await this.userFollowerRepository.deleteFollower(userId, unfollowUserId);
        if (result) await this.auditService.log({ userId, action: "USER_UNFOLLOWED", details: `Unfollowed user ${unfollowUserId}` });
        return result;
    }

    async removeFollower(userId: number, followerToRemoveId: number): Promise<boolean> {
        const result = await this.userFollowerRepository.deleteFollower(userId, followerToRemoveId);
        if (result) await this.auditService.log({ userId, action: "FOLLOWER_REMOVED", details: `Removed follower ${followerToRemoveId}` });
        return result;
    }
}
