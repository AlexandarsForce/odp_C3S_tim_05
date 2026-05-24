import { ICommunityService } from "../../Domain/services/communities/ICommunityService";
import { ICommunityRepository } from "../../Domain/repositories/communities/ICommunityRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { CommunityDto } from "../../Domain/DTOs/communities/CommunityDto";
import { CreateCommunityDto } from "../../Domain/DTOs/communities/CreateCommunityDto";
import { UpdateCommunityDto } from "../../Domain/DTOs/communities/UpdateCommunityDto";
import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CommunityType } from "../../Domain/enums/CommunityType";
import { Community } from "../../Domain/models/Community";

export class CommunityService implements ICommunityService {
  public constructor(
    private readonly communityRepository: ICommunityRepository,
    private readonly auditService: IAuditService
  ) {}

  toDto(community: Community): CommunityDto {
    return new CommunityDto(
      community.id,
      community.ownerId,
      community.name,
      community.description,
      community.rules,
      community.avatarPicture,
      community.type,
      community.createdAt,
      community.updatedAt,
    );
  }

    async createCommunity(userId: number, createCommunityDto: CreateCommunityDto): Promise<CommunityDto> {
        const community = new Community(0, createCommunityDto.ownerId, createCommunityDto.name, createCommunityDto.description, createCommunityDto.rules, createCommunityDto.avatarPicture, createCommunityDto.type);
        const created = await this.communityRepository.createCommunity(community);
        if (created.id === 0) return new CommunityDto();
        await this.auditService.log({ userId, action: "COMMUNITY_CREATED", details: "communities"});
        return this.toDto(created);
    }

    async getCommunityDetails(communityId: number): Promise<CommunityDto> {
        const community = await this.communityRepository.findCommunityById(communityId);
        if (community.id === 0) return new CommunityDto();
        return this.toDto(community);
    }

    async getAllCommunities( page: number, limit: number, isAdmin: boolean): Promise<PaginatedListDto<CommunityDto>> {
        if(isAdmin) {
            const { communities, totalAmount } = await this.communityRepository.findAllCommunities();
            return new PaginatedListDto(communities.map((c) => this.toDto(c)), totalAmount, page, limit);
        }
        return new PaginatedListDto<CommunityDto>();
    }

    async getPublicCommunities(page: number, limit: number): Promise<PaginatedListDto<CommunityDto>> {
        const { communities, totalAmount } = await this.communityRepository.findCommunityByType(CommunityType.PUBLIC);
        return new PaginatedListDto(communities.map((c) => this.toDto(c)), totalAmount, page, limit);
    }

    async getCommunityByMemberId(memberId: number, page: number, limit: number): Promise<PaginatedListDto<CommunityDto>> {
        const { communities, totalAmount } = await this.communityRepository.findCommunityByMemberId(memberId);
        return new PaginatedListDto(communities.map((c) => this.toDto(c)), totalAmount, page, limit);
    }

    async updateCommunity(userId: number, communityId: number, updateCommunityDto: UpdateCommunityDto): Promise<boolean> {
        const updated = new Community(communityId, userId, updateCommunityDto.name, updateCommunityDto.description, updateCommunityDto.rules, updateCommunityDto.avatarPicture, updateCommunityDto.type);
        const success = await this.communityRepository.updateCommunity(communityId, updated);
        if (success) await this.auditService.log({ userId, action: "COMMUNITY_UPDATED", details: "communities"});
        return success;
    }

    async deleteCommunity(userId: number, communityId: number): Promise<boolean> {
        const success = await this.communityRepository.deleteCommunity(communityId);
        if (success) await this.auditService.log({ userId, action: "COMMUNITY_DELETED", details: "communities"});
        return success;
    }

}