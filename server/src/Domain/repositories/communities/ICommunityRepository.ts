import { Community } from "../../models/Community";
import { CommunityMember } from "../../models/CommunityMember";
import { CommunityType } from "../../enums/CommunityType";

export interface ICommunityRepository {
  createCommunity(community: Community): Promise<Community>;
  addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;

  findCommunityById(communityId: number): Promise<Community>;
  findCommunityByName(name: string): Promise<Community>;
  findCommunityByType(type: CommunityType): Promise<Community[]>;
  findCommunityByOwnerId(ownerId: number): Promise<Community[]>;
  findCommunityByMemberId(memberId: number): Promise<Community[]>;
  findAllCommunityMembers(communityId: number): Promise<CommunityMember[]>;

  updateCommunity(communityId: number, community: Community): Promise<boolean>;

  deleteCommunity(communityId: number): Promise<boolean>;
  removeCommunityMember(communityId: number, memberId: number): Promise<boolean>;
}