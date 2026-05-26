import { TagDto } from "../../Domain/DTOs/tag/TagDto";
import { CreateTagDto } from "../../Domain/DTOs/tag/CreateTagDto";
import { ITagService } from "../../Domain/services/tags/ITagService";
import { ITagRepository } from "../../Domain/repositories/tags/ITagRepository";
import { Tag } from "../../Domain/models/Tag";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class TagService implements ITagService {
    public constructor(
        private readonly tagRepository: ITagRepository,
        private readonly auditService: IAuditService
    ) {}

    private toDto(tag: Tag): TagDto {
        return new TagDto(tag.id, tag.name);
    }

    async getAllTags(): Promise<TagDto[]> {
        const tags = await this.tagRepository.findAllTags();
        return tags.map(t => this.toDto(t));
    }

    async createTag(userId: number, dto: CreateTagDto): Promise<TagDto> {
        const created = await this.tagRepository.createTag(new Tag(0, dto.name));
        if (created.id === 0) return new TagDto();
        await this.auditService.log({ userId, action: "TAG_CREATED", details: "tags" });
        return this.toDto(created);
    }

    async deleteTag(userId: number, tagId: number): Promise<boolean> {
        const success = await this.tagRepository.deleteTag(tagId);
        if (success) await this.auditService.log({ userId, action: "TAG_DELETED", details: "tags" });
        return success;
    }
}
