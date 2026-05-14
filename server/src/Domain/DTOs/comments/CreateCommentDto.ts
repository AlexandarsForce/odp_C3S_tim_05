export class CreateCommentDto{
    public constructor(
        public postId: number = 0,
        public authorId: number = 0,
        public parentId: number | null = null,
        public content: string = "",
    ) {}
}