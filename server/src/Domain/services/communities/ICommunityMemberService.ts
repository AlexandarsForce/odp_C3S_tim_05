import { UpdateCommunityMemberRoleDto } from '../../DTOs/communities/UpdateCommunityMemberRoleDto';
import { ResponseCommunityDto } from '../../DTOs/communities/ResponseCommunityDto';
import { PaginatedListDto } from '../../DTOs/entity/PaginatedListDto';
import { CommunityMemberDto } from '../../DTOs/communities/CommunityMemberDto';

export interface ICommunityMemberService {
    requestJoinCommunity(userId: number, communityId: number): Promise<boolean>;
    responseJoinCommunity(userId: number, communityId: number, response: ResponseCommunityDto ): Promise<boolean>;

    getCommunityMembers(userId: number, communityId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityMemberDto>>;
    
    updateCommunityMemberRole(userId: number, memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto ): Promise<boolean>;

    removeCommunityMember(userId: number, memberId: number, communityId: number): Promise<boolean>;
    leaveCommunity(userId: number, communityId: number ): Promise<boolean>;
}