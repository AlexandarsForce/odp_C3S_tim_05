import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { IPostService, PostQueryFilters } from "../../Domain/services/posts/IPostService";
import { IPostRepository } from "../../Domain/repositories/posts/IPostRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { ICommunityMemberRepository } from "../../Domain/repositories/communities/ICommunityMemberRepository";
import { CommunityMemberRole } from "../../Domain/enums/CommunityMemberRole";
import { Post } from "../../Domain/models/Post";
import { PostDto } from "../../Domain/DTOs/posts/PostDto";
import { CreatePostDto } from "../../Domain/DTOs/posts/CreatePostDto";
import { UpdatePostDto } from "../../Domain/DTOs/posts/UpdatePostDto";

export class PostService implements IPostService {
    public constructor(
        private readonly postRepository: IPostRepository,
        private readonly auditService: IAuditService,
        private readonly communityMemberRepository: ICommunityMemberRepository
    ) {}

    toDto(post: Post): PostDto {
        return new PostDto(
            post.id,
            post.authorId,
            post.communityId,
            post.title,
            post.content,
            post.mediaAttachment,
            post.deleted,
            post.createdAt
        );
    }

    async createPost(userId: number, post: CreatePostDto): Promise<PostDto> {
        const newPost = new Post(0, userId, post.communityId, post.title, post.content, post.mediaAttachment);
        const created = await this.postRepository.createPost(newPost);
        if (created.id === 0) return new PostDto();
        await this.auditService.log({ userId, action: "POST_CREATED", details: "posts"});
        return this.toDto(created);
    }

    async getAllPosts(communityId: number, page: number, limit: number, filters?: PostQueryFilters): Promise<PaginatedListDto<PostDto>> {
        const { posts, totalAmount } = await this.postRepository.findPostsByCommunityId(communityId, page, limit, filters);
        return new PaginatedListDto(posts.map((p) => this.toDto(p)), totalAmount, page, limit);
    }

    async getFeed(userId: number, page: number, limit: number): Promise<PaginatedListDto<PostDto>> {
        const { posts, totalAmount } = await this.postRepository.findFeedPosts(userId, page, limit);
        return new PaginatedListDto(posts.map((p) => this.toDto(p)), totalAmount, page, limit);
    }

    async getPostDetails(postId: number): Promise<PostDto> {
        const post = await this.postRepository.findPostById(postId);
        if (post.id === 0) return new PostDto();
        return this.toDto(post);
    }

    async updatePost(userId: number, postId: number, post: UpdatePostDto): Promise<boolean> {
        const existingPost = await this.postRepository.findPostById(postId);
        if (existingPost.id === 0) return false;

        const isAuthor = existingPost.authorId === userId;
        if (!isAuthor) {
            const membership = await this.communityMemberRepository.findCommunityMemberById(existingPost.communityId, userId);
            if (membership.userId === 0 || membership.role !== CommunityMemberRole.MODERATOR) return false;
        }

        const updatedPost = new Post(postId, existingPost.authorId, existingPost.communityId, post.title, post.content, post.mediaAttachment);
        const success = await this.postRepository.updatePost(postId, updatedPost);
        if (success) await this.auditService.log({ userId, action: "POST_UPDATED", details: "posts"});
        return success;
    }

    async deletePost(userId: number, postId: number): Promise<boolean> {
        const existingPost = await this.postRepository.findPostById(postId);
        if (existingPost.id === 0) return false;

        const isAuthor = existingPost.authorId === userId;
        if (!isAuthor) {
            const membership = await this.communityMemberRepository.findCommunityMemberById(existingPost.communityId, userId);
            if (membership.userId === 0 || membership.role !== CommunityMemberRole.MODERATOR) return false;
        }

        const success = await this.postRepository.deletePost(postId);
        if (success) await this.auditService.log({ userId, action: "POST_DELETED", details: "posts"});
        return success;
    }
}
