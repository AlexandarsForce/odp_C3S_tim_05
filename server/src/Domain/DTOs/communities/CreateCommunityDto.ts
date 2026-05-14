import { CommunityType } from "../../enums/CommunityType";

export class CreateCommunityDto {
    public constructor(
        public ownerId: number = 0,
        public name: string = "",
        public description: string = "",
        public rules: string = "",
        public avatarPicture: string = "",
        public type: CommunityType = CommunityType.PRIVATE,
    ) {}
}