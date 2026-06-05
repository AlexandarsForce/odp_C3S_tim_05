import { UpdateCommunityMemberRoleDto } from '../../DTOs/communities/UpdateCommunityMemberRoleDto';
import { ResponseCommunityDto } from '../../DTOs/communities/ResponseCommunityDto';
import { PaginatedListDto } from '../../DTOs/entity/PaginatedListDto';
import { CommunityMemberDto } from '../../DTOs/communities/CommunityMemberDto';
import { UpdateMemberRoleResult } from '../../enums/UpdateMemberRoleResult';
import { RequestJoinResult } from '../../enums/RequestJoinResult';
import { LeaveCommunityResult } from '../../enums/LeaveCommunityResult';
import { CommunityAccessResult } from '../../enums/CommunityAccessResult';

export interface ICommunityMemberService {
    requestJoinCommunity(userId: number, communityId: number): Promise<RequestJoinResult>;
    responseJoinCommunity(actorId: number, communityId: number, targetUserId: number, response: ResponseCommunityDto): Promise<boolean>;

    isModerator(userId: number, communityId: number): Promise<boolean>;
    isActiveMember(userId: number, communityId: number): Promise<boolean>;

    // True if community is public OR (private AND user is active member) OR isAdmin
    canViewPrivateContent(userId: number, communityId: number, isAdmin: boolean): Promise<CommunityAccessResult>;

    getCommunityMembers(userId: number, communityId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityMemberDto>>;

    updateCommunityMemberRole(actorId: number, memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto): Promise<UpdateMemberRoleResult>;

    removeCommunityMember(userId: number, memberId: number, communityId: number): Promise<boolean>;
    leaveCommunity(userId: number, communityId: number): Promise<LeaveCommunityResult>;
}
