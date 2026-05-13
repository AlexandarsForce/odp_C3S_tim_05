import { CommunityMember } from "../../models/CommunityMember";
import { CommunityMemberRole } from "../../enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../enums/CommunityMemberStatus";

export interface ICommunityMemberRepository {
  addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;

  findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember>;
  findCommunityMemberByRole(communityId: number, role: CommunityMemberRole): Promise<{ members: CommunityMember[], totalAmount: number }>;
  findCommunityMemberByStatus(communityId: number, status: CommunityMemberStatus): Promise<{ members: CommunityMember[], totalAmount: number }>;
  findAllCommunityMembers(communityId: number): Promise<{ members: CommunityMember[], totalAmount: number }>;
  
  removeCommunityMember(communityId: number, memberId: number): Promise<boolean>;
}