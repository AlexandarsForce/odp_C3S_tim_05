import { ICommunityMemberService } from "../../Domain/services/communities/ICommunityMemberService";
import { ICommunityMemberRepository } from "../../Domain/repositories/communities/ICommunityMemberRepository";
import { ICommunityRepository } from "../../Domain/repositories/communities/ICommunityRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { UpdateCommunityMemberRoleDto } from "../../Domain/DTOs/communities/UpdateCommunityMemberRoleDto";
import { ResponseCommunityDto } from "../../Domain/DTOs/communities/ResponseCommunityDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CommunityMemberDto } from "../../Domain/DTOs/communities/CommunityMemberDto";
import { CommunityMember } from "../../Domain/models/CommunityMember";
import { CommunityMemberRole } from "../../Domain/enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../Domain/enums/CommunityMemberStatus";
import { CommunityType } from "../../Domain/enums/CommunityType";
import { UpdateMemberRoleResult } from "../../Domain/enums/UpdateMemberRoleResult";
import { RequestJoinResult } from "../../Domain/enums/RequestJoinResult";
import { LeaveCommunityResult } from "../../Domain/enums/LeaveCommunityResult";
import { CommunityAccessResult } from "../../Domain/enums/CommunityAccessResult";

export class CommunityMemberService implements ICommunityMemberService {
    public constructor(
        private readonly memberRepository: ICommunityMemberRepository,
        private readonly communityRepository: ICommunityRepository,
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
        const member = await this.memberRepository.findCommunityMemberById(communityId, userId);
        return member.userId !== 0 && member.role === CommunityMemberRole.MODERATOR && member.status === CommunityMemberStatus.ACTIVE;
    }

    async isActiveMember(userId: number, communityId: number): Promise<boolean> {
        const member = await this.memberRepository.findCommunityMemberById(communityId, userId);
        return member.userId !== 0 && member.status === CommunityMemberStatus.ACTIVE;
    }

    async canViewPrivateContent(userId: number, communityId: number, isAdmin: boolean): Promise<CommunityAccessResult> {
        // Admin bypasses every check
        if (isAdmin) return CommunityAccessResult.Allowed;

        const community = await this.communityRepository.findCommunityById(communityId);
        if (community.id === 0) return CommunityAccessResult.NotFound;

        // Public community → content visible to all authenticated users
        if (community.type === CommunityType.PUBLIC) return CommunityAccessResult.Allowed;

        // Private community → must be an active member to view posts / comments
        const member = await this.memberRepository.findCommunityMemberById(communityId, userId);
        const isMember = member.userId !== 0 && member.status === CommunityMemberStatus.ACTIVE;
        return isMember ? CommunityAccessResult.Allowed : CommunityAccessResult.Forbidden;
    }

    async requestJoinCommunity(userId: number, communityId: number): Promise<RequestJoinResult> {
        // Community must exist
        const community = await this.communityRepository.findCommunityById(communityId);
        if (community.id === 0) return RequestJoinResult.NotFound;

        // Check existing membership (banned / active / pending)
        const existing = await this.memberRepository.findCommunityMemberById(communityId, userId);
        if (existing.userId !== 0) {
            if (existing.status === CommunityMemberStatus.BANNED) return RequestJoinResult.Banned;
            if (existing.status === CommunityMemberStatus.ACTIVE) return RequestJoinResult.AlreadyMember;
            if (existing.status === CommunityMemberStatus.PENDING) return RequestJoinResult.AlreadyPending;
        }

        // Public community → instant join (ACTIVE); private → request (PENDING)
        const isPublic = community.type === CommunityType.PUBLIC;
        const newStatus = isPublic ? CommunityMemberStatus.ACTIVE : CommunityMemberStatus.PENDING;
        const member = new CommunityMember(userId, communityId, CommunityMemberRole.MEMBER, newStatus);
        const ok = await this.memberRepository.addCommunityMember(communityId, member);
        if (!ok) return RequestJoinResult.Unavailable;

        await this.auditService.log({
            userId,
            action: isPublic ? "JOIN_COMMUNITY" : "REQUEST_JOIN_COMMUNITY",
            details: `communityId: ${communityId}`
        });
        return isPublic ? RequestJoinResult.Joined : RequestJoinResult.Success;
    }

    async responseJoinCommunity(actorId: number, communityId: number, targetUserId: number, response: ResponseCommunityDto): Promise<boolean> {
        const applicant = await this.memberRepository.findCommunityMemberById(communityId, targetUserId);
        if (applicant.userId === 0 || applicant.status !== CommunityMemberStatus.PENDING) return false;

        const newStatus = response.accepted ? CommunityMemberStatus.ACTIVE : CommunityMemberStatus.BANNED;
        const result = await this.memberRepository.updateMemberStatus(communityId, targetUserId, newStatus);
        if (result) {
            await this.auditService.log({ userId: actorId, action: "RESPONSE_JOIN_COMMUNITY", details: `communityId: ${communityId}, targetUserId: ${targetUserId}, accepted: ${response.accepted}` });
        }
        return result;
    }

    async getCommunityMembers(userId: number, communityId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityMemberDto>> {
        const { members, totalAmount } = await this.memberRepository.findAllCommunityMembers(communityId, page, limit);
        return new PaginatedListDto(members.map((m) => this.toDto(m)), totalAmount, page, limit);
    }

    async updateCommunityMemberRole(actorId: number, memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto): Promise<UpdateMemberRoleResult> {
        const communityMember = await this.memberRepository.findCommunityMemberById(communityId, memberId);
        if (communityMember.userId === 0) return UpdateMemberRoleResult.NotFound;

        if (newRole.role === CommunityMemberRole.MEMBER && communityMember.role === CommunityMemberRole.MODERATOR) {
            const { totalAmount } = await this.memberRepository.findCommunityMemberByRole(communityId, CommunityMemberRole.MODERATOR, 1, 1);
            if (totalAmount <= 1) return UpdateMemberRoleResult.LastModerator;
        }

        communityMember.role = newRole.role;
        const ok = await this.memberRepository.updateCommunityMember(communityId, communityMember);
        if (ok) {
            await this.auditService.log({ userId: actorId, action: "UPDATE_COMMUNITY_MEMBER_ROLE", details: `communityId: ${communityId}, memberId: ${memberId}, newRole: ${newRole.role}` });
        }
        return ok ? UpdateMemberRoleResult.Success : UpdateMemberRoleResult.NotFound;
    }

    async removeCommunityMember(userId: number, memberId: number, communityId: number): Promise<boolean> {
        const result = await this.memberRepository.removeCommunityMember(communityId, memberId);
        if (result) {
            await this.auditService.log({ userId, action: "REMOVE_COMMUNITY_MEMBER", details: `communityId: ${communityId}, memberId: ${memberId}` });
        }
        return result;
    }

    async leaveCommunity(userId: number, communityId: number): Promise<LeaveCommunityResult> {
        const member = await this.memberRepository.findCommunityMemberById(communityId, userId);
        if (member.userId === 0) return LeaveCommunityResult.NotFound;

        // If user is a moderator, ensure they are NOT the last one
        if (member.role === CommunityMemberRole.MODERATOR) {
            const { totalAmount } = await this.memberRepository.findCommunityMemberByRole(communityId, CommunityMemberRole.MODERATOR, 1, 1);
            if (totalAmount <= 1) return LeaveCommunityResult.LastModerator;
        }

        const ok = await this.memberRepository.removeCommunityMember(communityId, userId);
        if (!ok) return LeaveCommunityResult.NotFound;
        await this.auditService.log({ userId, action: "LEAVE_COMMUNITY", details: `communityId: ${communityId}` });
        return LeaveCommunityResult.Success;
    }
}
