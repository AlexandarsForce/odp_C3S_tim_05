import { ICommunityMemberService } from "../../Domain/services/communities/ICommunityMemberService";
import { ICommunityMemberRepository } from "../../Domain/repositories/communities/ICommunityMemberRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { UpdateCommunityMemberRoleDto } from "../../Domain/DTOs/communities/UpdateCommunityMemberRoleDto";
import { ResponseCommunityDto } from "../../Domain/DTOs/communities/ResponseCommunityDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CommunityMemberDto } from "../../Domain/DTOs/communities/CommunityMemberDto";
import { CommunityMember } from "../../Domain/models/CommunityMember";
import { CommunityMemberRole } from "../../Domain/enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../Domain/enums/CommunityMemberStatus";

export class CommunityMemberService implements ICommunityMemberService {
    public constructor(
        private readonly communityRepository: ICommunityMemberRepository,
        private readonly auditService: IAuditService
    ) {}

    toDto(communityMember: CommunityMember): CommunityMemberDto {
        return new CommunityMemberDto(
            communityMember.userId,
            communityMember.communityId,
            communityMember.role,
            communityMember.status,
            communityMember.joinedAt
        );
    }

    async requestJoinCommunity(userId: number, communityId: number): Promise<boolean> {
        const communityMember = new CommunityMember(userId, communityId);
        const result = await this.communityRepository.addCommunityMember(communityId, communityMember);
        if (result) {
            await this.auditService.log({ userId, action: "REQUEST_JOIN_COMMUNITY", details: `communityId: ${communityId}` });
        }
        return result;
    }

    async responseJoinCommunity(userId: number, communityId: number, response: ResponseCommunityDto): Promise<boolean> {
        const communityMember = new CommunityMember(userId, communityId);
        const result = await this.communityRepository.addCommunityMember(communityId, communityMember);
        if (result) {
            await this.auditService.log({ userId, action: "RESPONSE_JOIN_COMMUNITY", details: `communityId: ${communityId}, accepted: ${response.accepted}` });
        }
        return result;
    }

    async getCommunityMembers(userId: number, communityId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityMemberDto>> {
        const { members, totalAmount } = await this.communityRepository.findAllCommunityMembers(communityId);
        return new PaginatedListDto(members.map((m) => this.toDto(m)), totalAmount, page, limit);
    }

    async updateCommunityMemberRole(userId: number, memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto): Promise<boolean> {
        const communityMember = await this.communityRepository.findCommunityMemberById(communityId, memberId);
        if (communityMember.userId === 0) return false;
        communityMember.role = newRole.role;
        const result = await this.communityRepository.updateCommunityMember(communityId, communityMember);
        if (result) {
            await this.auditService.log({ userId, action: "UPDATE_COMMUNITY_MEMBER_ROLE", details: `communityId: ${communityId}, memberId: ${memberId}, newRole: ${newRole.role}` });
        }
        return result;
    }

    async removeCommunityMember(userId: number, memberId: number, communityId: number): Promise<boolean> {
        const result = await this.communityRepository.removeCommunityMember(communityId, memberId);
        if (result) {
            await this.auditService.log({ userId, action: "REMOVE_COMMUNITY_MEMBER", details: `communityId: ${communityId}, memberId: ${memberId}` });
        }
        return result;
    }

    async leaveCommunity(userId: number, communityId: number): Promise<boolean> {
        const result = await this.communityRepository.removeCommunityMember(communityId, userId);
        if (result) {
            await this.auditService.log({ userId, action: "LEAVE_COMMUNITY", details: `communityId: ${communityId}` });
        }
        return result;
    }

}