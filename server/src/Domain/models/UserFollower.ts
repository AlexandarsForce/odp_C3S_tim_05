export class UserFollower {
    constructor(
        public followerId: number = 0,
        public followingId: number = 0,
        public followedAt: Date = new Date(),
    ) {}
}