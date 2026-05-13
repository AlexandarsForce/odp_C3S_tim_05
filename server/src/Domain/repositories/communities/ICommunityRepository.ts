import { Community } from "../../models/Community";
import { CommunityMember } from "../../models/CommunityMember";
import { CommunityType } from "../../enums/CommunityType";

export interface ICommunityRepository {
  createCommunity(community: Community): Promise<Community>;
  addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;

  findCommunityById(communityId: number): Promise<Community>;
  findCommunityByName(name: string): Promise<Community>;
  findCommunityByType(type: CommunityType): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByOwnerId(ownerId: number): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityByMemberId(memberId: number): Promise<{ communities: Community[], totalAmount: number }>;
  findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember>;
  findAllCommunityMembers(communityId: number): Promise<{ members: CommunityMember[], totalAmount: number }>;

  updateCommunity(communityId: number, community: Community): Promise<boolean>;

  deleteCommunity(communityId: number): Promise<boolean>;
  removeCommunityMember(communityId: number, memberId: number): Promise<boolean>;
}