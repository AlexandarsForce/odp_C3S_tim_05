import { CommentLikeDto } from "../../Domain/DTOs/comments/CommentLikeDto";
import { CreateCommentLikeDto } from "../../Domain/DTOs/comments/CreateCommentLikeDto";
import { ICommentLikeService } from "../../Domain/services/comments/ICommentLikeService";
import { ICommentLikeRepository } from "../../Domain/repositories/comments/ICommentLikeRepository";
import { CommentLike } from "../../Domain/models/CommentLike";
import { IAuditService } from "../../Domain/services/audit/IAuditService";

export class CommentLikeService implements ICommentLikeService {
    constructor(
        private commentLikeRepository: ICommentLikeRepository,
        private auditService: IAuditService
    ) {}

    toCommentLikeDto(commentLike: CommentLike): CommentLikeDto {
        return {
            userId: commentLike.userId,
            commentId: commentLike.commentId,
            liked: commentLike.liked,
            likedAt: commentLike.likedAt,
        };
    }

    async likeComment(userId: number, commentId: number, commentLike: CreateCommentLikeDto): Promise<CommentLikeDto> {
        if (await this.commentLikeRepository.isLikedByUser(commentId, userId)) {
            return new CommentLikeDto();
        }
        const newLike = await this.commentLikeRepository.addCommentLike(commentId, new CommentLike(
            userId,
            commentId,
            commentLike.liked,
            new Date()
        ));
        if (newLike.userId === 0) return new CommentLikeDto();
        await this.auditService.log({ userId, action: "COMMENT_LIKED", details: "comments" });
        return this.toCommentLikeDto(newLike);
    }

async unlikeComment(userId: number, commentId: number): Promise<boolean> {
        const existingLike = await this.commentLikeRepository.isLikedByUser(commentId, userId);
        if (!existingLike) return false;
        const deleted = await this.commentLikeRepository.deleteCommentLike(commentId, userId);
        if (deleted) {
            await this.auditService.log({ userId, action: "COMMENT_UNLIKED", details: "comments" });
        }
        return deleted;
    }

}