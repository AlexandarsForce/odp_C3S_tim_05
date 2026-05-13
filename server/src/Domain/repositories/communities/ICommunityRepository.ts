import { Community } from "../../models/Community";
import { CommunityType } from "../../enums/CommunityType";

export interface ICommunityRepository {
  createCommunity(community: Community): Promise<Community>;

  findCommunityById(communityId: number): Promise<Community>;
  findCommunityByName(name: string): Promise<Community>;
  findCommunityByType(type: CommunityType): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByOwnerId(ownerId: number): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByMemberId(memberId: number): Promise<{ communities: Community[], totalAmount: number }>;

  updateCommunity(communityId: number, community: Community): Promise<boolean>;

  deleteCommunity(communityId: number): Promise<boolean>;
}