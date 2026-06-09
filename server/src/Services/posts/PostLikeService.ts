import { PaginatedListDto } from "../../Domain/DTOs/utils/PaginatedListDto";
import { PostLikeDto } from "../../Domain/DTOs/posts/PostLikeDto";
import { CreatePostLikeDto } from "../../Domain/DTOs/posts/CreatePostLikeDto";
import { IPostLikeService, LikePostResult } from "../../Domain/services/posts/IPostLikeService";
import { IPostLikeRepository } from "../../Domain/repositories/posts/IPostLikeRepository";
import { IPostRepository } from "../../Domain/repositories/posts/IPostRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { PostLike } from "../../Domain/models/PostLike";

export class PostLikeService implements IPostLikeService {
    public constructor(
        private readonly postLikeRepository: IPostLikeRepository,
        private readonly auditService: IAuditService,
        private readonly postRepository: IPostRepository
    ) {}

    toDto(postLike: PostLike): PostLikeDto {
        return new PostLikeDto(
            postLike.userId,
            postLike.postId,
            postLike.liked,
            postLike.likedAt
        );
    }

    async likePost(userId: number, postId: number, postLike: CreatePostLikeDto): Promise<LikePostResult> {
        const post = await this.postRepository.findPostById(postId);
        if (post.id === 0) {
            return { success: false, reason: 'ERROR' };
        }

        if (post.authorId === userId) {
            return { success: false, reason: 'OWN_POST' };
        }

        const alreadyLiked = await this.postLikeRepository.isLikedByUser(postId, userId);
        if (alreadyLiked) {
            return { success: false, reason: 'DUPLICATE' };
        }

        const newLike = new PostLike(userId, postId, postLike.liked);
        const liked = await this.postLikeRepository.addPostLike(postId, newLike);
        if (liked.userId === 0) return { success: false, reason: 'ERROR' };

        await this.auditService.log({ userId, action: "POST_LIKED", details: "posts" });
        return { success: true, data: this.toDto(liked) };
    }

    async unlikePost(userId: number, postId: number): Promise<boolean> {
        const alreadyLiked = await this.postLikeRepository.isLikedByUser(postId, userId);
        if (!alreadyLiked) {
            return false;
        }
        const success = await this.postLikeRepository.deletePostLike(postId, userId);
        if (success) {
            await this.auditService.log({ userId, action: "POST_UNLIKED", details: "posts" });
        }
        return success;
    }

    async getPostLikes(userId: number, postId: number, page: number, limit: number): Promise<PaginatedListDto<PostLikeDto>> {
        const { likes, totalAmount } = await this.postLikeRepository.findPostLikesByPostId(postId, page, limit);
        const likeDtos = likes.map(like => this.toDto(like));
        return new PaginatedListDto<PostLikeDto>(likeDtos, totalAmount, page, limit);
    }

    async isLikedByUser(userId: number, postId: number): Promise<boolean> {
        return this.postLikeRepository.isLikedByUser(postId, userId);
    }
}
