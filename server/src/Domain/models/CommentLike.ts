export class CommentLike {
    constructor(
        public userId: number = 0,
        public commentId: number = 0,
        public liked: number = 0,
        public likedAt: Date = new Date()
    ) {}
}