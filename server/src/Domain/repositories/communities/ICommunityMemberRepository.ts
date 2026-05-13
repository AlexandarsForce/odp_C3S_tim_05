import { CommunityMember } from "../../models/CommunityMember";

export interface ICommunityMemberRepository {
  addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;

  findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember>;
  findAllCommunityMembers(communityId: number): Promise<{ members: CommunityMember[], totalAmount: number }>;
  
  removeCommunityMember(communityId: number, memberId: number): Promise<boolean>;
}