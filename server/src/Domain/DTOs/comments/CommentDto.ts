export class CommentDto{
    public constructor(
        public id: number = 0,
        public postId: number = 0,
        public authorId: number = 0,
        public parentId: number | null = null,
        public content: string = "",
        public deleted: boolean = false,
        public createdAt: Date = new Date(),
    ) {}
}