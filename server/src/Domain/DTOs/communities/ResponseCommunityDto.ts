import { CommunityMemberStatus } from "../../enums/CommunityMemberStatus";

export class ResponseCommunityDto {
    public constructor(
        public status: CommunityMemberStatus,
    ) {}
}
        