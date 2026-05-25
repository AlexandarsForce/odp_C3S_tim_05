import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { IUserFollowerService } from "../../Domain/services/users/IUserFollowerService";
import { UserFollowerDto } from "../../Domain/DTOs/users/UserFollowerDto";
import { IUserFollowerRepository } from "../../Domain/repositories/users/IUserFollowerRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class UserFollowerService implements IUserFollowerService {
    public constructor(
        private readonly userFollowerRepository: IUserFollowerRepository,
        private readonly auditService: IAuditService
    ) {}

    async followUser(userId: number, followUserId: number): Promise<boolean> {
        if (userId === followUserId) return false; 
        const result = await this.userFollowerRepository.addFollower(userId, followUserId);
        if (result) await this.auditService.log({ userId, action: "USER_FOLLOWED", details: `Followed user ${followUserId}` });
        return result;
    }

    async getFollowers(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>> {
        const { followers, totalAmount } = await this.userFollowerRepository.findAllFollowers(userId);
        const paginatedFollowers = followers.slice((page - 1) * limit, page * limit).map(f => new UserFollowerDto(f.followingId, f.followerId));
        return new PaginatedListDto(paginatedFollowers, totalAmount, page, limit);
    }

    async getFollowing(userId: number, page: number, limit: number): Promise<PaginatedListDto<UserFollowerDto>> {
        const { following, totalAmount } = await this.userFollowerRepository.findAllFollowing(userId);
        const paginatedFollowing = following.slice((page - 1) * limit, page * limit).map(f => new UserFollowerDto(f.followingId, f.followerId));
        return new PaginatedListDto(paginatedFollowing, totalAmount, page, limit);
    }

    async unfollowUser(userId: number, unfollowUserId: number): Promise<boolean> {
        const result = await this.userFollowerRepository.deleteFollower(userId, unfollowUserId);
        if (result) await this.auditService.log({ userId, action: "USER_UNFOLLOWED", details: `Unfollowed user ${unfollowUserId}` });
        return result;
    }

}