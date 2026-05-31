import { CommunityMember } from "../../models/CommunityMember";
import { CommunityMemberRole } from "../../enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../enums/CommunityMemberStatus";

export interface ICommunityMemberRepository {
  addCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;

  findCommunityMemberById(communityId: number, memberId: number): Promise<CommunityMember>;
  findCommunityMemberByRole(communityId: number, role: CommunityMemberRole, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }>;
  findCommunityMemberByStatus(communityId: number, status: CommunityMemberStatus, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }>;
  findAllCommunityMembers(communityId: number, page: number, limit: number): Promise<{ members: CommunityMember[], totalAmount: number }>;
  
  updateCommunityMember(communityId: number, member: CommunityMember): Promise<boolean>;
  updateMemberStatus(communityId: number, memberId: number, status: CommunityMemberStatus): Promise<boolean>;

  removeCommunityMember(communityId: number, memberId: number): Promise<boolean>;
}