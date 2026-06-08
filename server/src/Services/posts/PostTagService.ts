import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { PostTagDto } from "../../Domain/DTOs/posts/PostTagDto";
import { CreatePostTagDto } from "../../Domain/DTOs/posts/CreatePostTagDto";
import { IPostTagService } from "../../Domain/services/posts/IPostTagService";
import { IPostTagRepository } from "../../Domain/repositories/posts/IPostTagRepository";
import { IPostRepository } from "../../Domain/repositories/posts/IPostRepository";
import { ICommunityMemberRepository } from "../../Domain/repositories/communities/ICommunityMemberRepository";
import { PostTag } from "../../Domain/models/PostTag";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { CommunityMemberRole } from "../../Domain/enums/CommunityMemberRole";

export class PostTagService implements IPostTagService {
    public constructor(
        private readonly postTagRepository: IPostTagRepository,
        private readonly postRepository: IPostRepository,
        private readonly communityMemberRepository: ICommunityMemberRepository,
        private readonly auditService: IAuditService
    ) {}

    toDto(postTag: PostTag): PostTagDto {
        return new PostTagDto(postTag.postId,postTag.tagId);
    }

    async addPostTag(userId: number, postId: number, postTag: CreatePostTagDto): Promise<PostTagDto> {
        // Only post author or community moderator can add tags
        const post = await this.postRepository.findPostById(postId);
        if (post.id === 0) return new PostTagDto();

        const isAuthor = post.authorId === userId;
        if (!isAuthor) {
            const membership = await this.communityMemberRepository.findCommunityMemberById(post.communityId, userId);
            if (membership.userId === 0 || membership.role !== CommunityMemberRole.MODERATOR) {
                return new PostTagDto(); // No permission
            }
        }

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
        // Only post author or community moderator can remove tags
        const post = await this.postRepository.findPostById(postId);
        if (post.id === 0) return false;

        const isAuthor = post.authorId === userId;
        if (!isAuthor) {
            const membership = await this.communityMemberRepository.findCommunityMemberById(post.communityId, userId);
            if (membership.userId === 0 || membership.role !== CommunityMemberRole.MODERATOR) {
                return false; // No permission
            }
        }

        const success = await this.postTagRepository.deletePostTag(postId, tagId);
        if (success) await this.auditService.log({ userId, action: "POST_TAG_REMOVED", details: "posts"});
        return success;
    }
}