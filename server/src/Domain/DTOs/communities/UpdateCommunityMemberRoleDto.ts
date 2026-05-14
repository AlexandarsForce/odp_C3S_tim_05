import { CommunityMemberRole } from "../../enums/CommunityMemberRole";

export class UpdateCommunityMemberRoleDto {
    public constructor(
        public role: CommunityMemberRole = CommunityMemberRole.MEMBER,
    ) {}
}