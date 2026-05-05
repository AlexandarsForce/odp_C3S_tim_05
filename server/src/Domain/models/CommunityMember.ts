import { CommunityMemberRole } from "../enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../enums/CommunityMemberStatus";

export class CommunityMember {
    constructor(
        public userId: number = 0,
        public communityId: number = 0,
        public role: CommunityMemberRole = CommunityMemberRole.MEMBER,
        public status: CommunityMemberStatus = CommunityMemberStatus.PENDING,
        public joinedAt: Date = new Date(),
    ) {}
}