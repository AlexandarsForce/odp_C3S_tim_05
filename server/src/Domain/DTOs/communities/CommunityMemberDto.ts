import { CommunityMemberRole } from "../../enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../enums/CommunityMemberStatus";

export class CommunityMemberDto {
    public constructor(
        public userId: number = 0,
        public communityId: number = 0,
        public role: CommunityMemberRole = CommunityMemberRole.MEMBER,
        public status: CommunityMemberStatus = CommunityMemberStatus.ACTIVE,
        public joinedAt: Date = new Date(),
        public username: string = "",
    ) {}
}