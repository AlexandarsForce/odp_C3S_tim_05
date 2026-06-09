export class UpdatePostDto {
    public constructor(
        public title: string = "",
        public content: string = "",
        public mediaAttachment: string = "",
        public tagIds: number[] = [],
    ) {}
}
