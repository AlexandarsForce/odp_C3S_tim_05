export class Post {
    constructor(
        public id: number = 0,
        public authorId: number = 0,
        public communityId: number = 0,
        public title: string = "",
        public content: string = "",
        public mediaAttachment: string = "",
        public deleted: number = 0,
        public createdAt: Date = new Date(),
    ) {}
}