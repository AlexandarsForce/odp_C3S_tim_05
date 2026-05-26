import { TagDto } from "../../DTOs/tag/TagDto";
import { CreateTagDto } from "../../DTOs/tag/CreateTagDto";

export interface ITagService {
    getAllTags(): Promise<TagDto[]>;

    createTag(userId: number, dto: CreateTagDto): Promise<TagDto>;

    deleteTag(userId: number, tagId: number): Promise<boolean>;
}
