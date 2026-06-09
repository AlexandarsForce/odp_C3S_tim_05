import { MentionDto } from "./MentionDto";

export class CommentDto{
    public constructor(
        public id: number = 0,
        public postId: number = 0,
        public authorId: number = 0,
        public authorUsername: string = "",
        public parentId: number = 0,
        public content: string = "",
        public deleted: boolean = false,
        public createdAt: Date = new Date(),
        public mentions: MentionDto[] = [],
        public reported: boolean = false,
        public likesCount: number = 0,
        public authorProfilePicture: string = "",
    ) {}
}
