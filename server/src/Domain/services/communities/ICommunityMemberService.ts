import { UpdateCommunityMemberRoleDto } from '../../DTOs/communities/UpdateCommunityMemberRoleDto';
import { ResponseCommunityDto } from '../../DTOs/communities/ResponseCommunityDto';

export interface ICommunityMemberService {
    requestJoinCommunity(userId: number, communityId: number): Promise<boolean>;
    responseJoinCommunity(userId: number, communityId: number, response: ResponseCommunityDto ): Promise<boolean>;

    updateCommunityMemberRole(memberId: number, communityId: number, newRole: UpdateCommunityMemberRoleDto ): Promise<boolean>;

    removeCommunityMember(memberId: number, communityId: number): Promise<boolean>;
    leaveCommunity(userId: number, communityId: number ): Promise<boolean>;
}