export class PostLike {
    constructor(
        public userId: number = 0,
        public postId: number = 0,
        public liked: number = 0,
        public likedAt: Date = new Date(),
    ) {}
}