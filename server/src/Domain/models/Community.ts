import { CommunityType } from "../enums/CommunityType";

export class Community {
    constructor(
        public id: number = 0,
        public ownerId: number = 0,
        public name: string = "",
        public description: string = "",
        public rules: string = "",
        public avatarPicture: string = "",
        public type: CommunityType = CommunityType.PRIVATE,
        public createdAt: Date = new Date(),
        public updatedAt: Date = new Date(),
        public memberCount: number = 0,
        // Populated only when the row was fetched via a member-aware query
        // (e.g. findCommunityByMemberId). Empty string means "not the viewer's row".
        public viewerRole: string = "",
    ) {}
}