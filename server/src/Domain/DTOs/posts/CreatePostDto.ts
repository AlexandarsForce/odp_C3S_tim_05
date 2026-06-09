export class CreatePostDto {
    public constructor(
        public communityId: number = 0,
        public title: string = "",
        public content: string = "",
        public mediaAttachment: string = "",
        public tagIds: number[] = [],
    ) {}
}
