import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { CommunityDto } from "../../DTOs/communities/CommunityDto";
import { CreateCommunityDto } from "../../DTOs/communities/CreateCommunityDto";
import { UpdateCommunityDto } from "../../DTOs/communities/UpdateCommunityDto";

export interface ICommunityService {
    createCommunity(userId: number, createCommunityDto: CreateCommunityDto): Promise<CommunityDto>;

    getCommunityById(communityId: number): Promise<CommunityDto>;
    getAllCommunities(page: number, limit: number): Promise<PaginatedListDto<CommunityDto>>;
    getPublicCommunities(page: number, limit: number): Promise<PaginatedListDto<CommunityDto>>;
    getCommunityByMemberId(memberId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityDto>>;

    updateCommunity(userId: number, communityId: string, updateCommunityDto: UpdateCommunityDto): Promise<boolean>;

    deleteCommunity(id: string): Promise<void>;
}