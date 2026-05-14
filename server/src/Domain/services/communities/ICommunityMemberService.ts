import { RequestCommunityDto } from '../../DTOs/communities/RequestCommunityDto';
import { ResponseCommunityDto } from '../../DTOs/communities/ResponseCommunityDto';
import { CommunityMemberRole } from "../../enums/CommunityMemberRole";

export interface ICommunityMemberService {
    requestJoinCommunity(communityId: number, requestCommunityDto: RequestCommunityDto): Promise<boolean>;
    responseJoinCommunity(communityId: number, responseCommunityDto: ResponseCommunityDto): Promise<boolean>;

    updateCommunityMemberRole(memberId: number, communityId: number, newRole: CommunityMemberRole ): Promise<boolean>;

    removeCommunityMember(memberId: number): Promise<boolean>;
    leaveCommunity(userId: number, communityId: number ): Promise<boolean>;
}