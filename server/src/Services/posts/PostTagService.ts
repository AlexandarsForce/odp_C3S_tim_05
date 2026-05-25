import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { PostTagDto } from "../../Domain/DTOs/posts/PostTagDto";
import { CreatePostTagDto } from "../../Domain/DTOs/posts/CreatePostTagDto";
import { IPostTagService } from "../../Domain/services/posts/IPostTagService";
import { IPostTagRepository } from "../../Domain/repositories/posts/IPostTagRepository";
import { PostTag } from "../../Domain/models/PostTag";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class PostTagService implements IPostTagService {
    public constructor(
        private readonly postTagRepository: IPostTagRepository,
        private readonly auditService: IAuditService
    ) {}

    toDto(postTag: PostTag): PostTagDto {
        return new PostTagDto(postTag.postId,postTag.tagId);
    }

    async addPostTag(userId: number, postId: number, postTag: CreatePostTagDto): Promise<PostTagDto> {
        const newPostTag = new PostTag(postId, postTag.tagId);
        const created = await this.postTagRepository.addPostTag(postId, newPostTag);
        if (created.postId === 0) return new PostTagDto();
        await this.auditService.log({ userId, action: "POST_TAG_ADDED", details: "posts"});
        return this.toDto(created);
    }

    async getPostTags(userId: number, postId: number, page: number, limit: number): Promise<PaginatedListDto<PostTagDto>> {
        const { tags, totalAmount } = await this.postTagRepository.findPostTagsByPostId(postId, page, limit);
        return new PaginatedListDto(tags.map((t) => this.toDto(t)), totalAmount, page, limit);
    }

    async removePostTag(userId: number, postId: number, tagId: number): Promise<boolean> {
        const success = await this.postTagRepository.deletePostTag(postId, tagId);
        if (success) await this.auditService.log({ userId, action: "POST_TAG_REMOVED", details: "posts"});
        return success;
    }
}