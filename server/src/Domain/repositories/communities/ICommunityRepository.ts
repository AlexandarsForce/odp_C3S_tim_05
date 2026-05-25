import { Community } from "../../models/Community";
import { CommunityType } from "../../enums/CommunityType";

export interface ICommunityRepository {
  createCommunity(community: Community): Promise<Community>;

  findCommunityById(communityId: number): Promise<Community>;
  findCommunityByName(name: string): Promise<Community>;
  findCommunityByType(type: CommunityType, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByOwnerId(ownerId: number, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByMemberId(memberId: number, page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }>;
  findAllCommunities(page: number, limit: number): Promise<{ communities: Community[], totalAmount: number }>;

  updateCommunity(communityId: number, community: Community): Promise<boolean>;

  deleteCommunity(communityId: number): Promise<boolean>;
}