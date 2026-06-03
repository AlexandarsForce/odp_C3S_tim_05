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
import { UpdateMemberRoleResult } from "../../Domain/enums/UpdateMemberRoleResult";

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

    async isModerator(userId: number, communityId: number): Promise<boolean> {
        const member = await this.communityRepository.findCommunityMemberById(communityId, userId);
        return member.userId !== 0 && member.role === CommunityMemberRole.MODERATOR && member.status === CommunityMemberStatus.ACTIVE;
    }

    async requestJoinCommunity(userId: number, communityId: number): Promise<boolean> {
        const communityMember = new CommunityMember(userId, communityId, CommunityMemberRole.MEMBER, CommunityMemberStatus.PENDING);
        const result = await this.communityRepository.addCommunityMember(communityId, communityMember);
        if (result) {
            await this.auditService.log({ userId, action: "REQUEST_JOIN_COMMUNITY", details: `communityId: ${communityId}` });
        }
        return result;
    }

    async responseJoinCommunity(actorId: number, communityId: number, targetUserId: number, response: ResponseCommunityDto): Promise<boolean> {
        const applicant = await this.communityRepository.findCommunityMemberById(communityId, targetUserId);
        if (applicant.userId === 0 || applicant.status !== CommunityMemberStatus.PENDING) return false;

        const newStatus = response.accepted ? CommunityMemberStatus.ACTIVE : CommunityMemberStatus.BANNED;
        const result = await this.communityRepository.updateMemberStatus(communityId, targetUserId, newStatus);
        if (result) {
            await this.auditService.log({ userId: actorId, action: "RESPONSE_JOIN_COMMUNITY", details: `communityId: ${communityId}, targetUserId: ${targetUserId}, accepted: ${response.accepted}` });
        }
        return result;
    }

    async getCommunityMembers(userId: number, communityId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityMemberDto>> {
        const { members, totalAmount } = await this.communityRepository.findAllCommunityMembers(communityId, page, limit);
        return new PaginatedListDto(members.map((m) => this.toDto(m)), totalAmount, page, limit);
    }

    async updateCommunityMemberRole(actorId: number, memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto): Promise<UpdateMemberRoleResult> {
        const communityMember = await this.communityRepository.findCommunityMemberById(communityId, memberId);
        if (communityMember.userId === 0) return UpdateMemberRoleResult.NotFound;

        if (newRole.role === CommunityMemberRole.MEMBER && communityMember.role === CommunityMemberRole.MODERATOR) {
            const { totalAmount } = await this.communityRepository.findCommunityMemberByRole(communityId, CommunityMemberRole.MODERATOR, 1, 1);
            if (totalAmount <= 1) return UpdateMemberRoleResult.LastModerator;
        }

        communityMember.role = newRole.role;
        const ok = await this.communityRepository.updateCommunityMember(communityId, communityMember);
        if (ok) {
            await this.auditService.log({ userId: actorId, action: "UPDATE_COMMUNITY_MEMBER_ROLE", details: `communityId: ${communityId}, memberId: ${memberId}, newRole: ${newRole.role}` });
        }
        return ok ? UpdateMemberRoleResult.Success : UpdateMemberRoleResult.NotFound;
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
