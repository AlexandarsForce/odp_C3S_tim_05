export class UpdatePostDto {
    public constructor(
        public authorId: number = 0,
        public communityId: number = 0,
        public title: string = "",
        public content: string = "",
        public mediaAttachment: string = "",
        public tagIds: number[] = [],
    ) {}
}
