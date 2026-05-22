import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CommentDto } from "../../Domain/DTOs/comments/CommentDto";
import { CreateCommentDto } from "../../Domain/DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../Domain/DTOs/comments/UpdateCommentDto";
import { ICommentService } from "../../Domain/services/comments/ICommentService";
import { ICommentRepository } from "../../Domain/repositories/comments/ICommentRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { Comment } from "../../Domain/models/Comment";

export class CommentService implements ICommentService {
    constructor(
        private commentRepository: ICommentRepository,
        private auditService: IAuditService
    ) {}

    toCommentDto(comment: Comment): CommentDto {
        return {
            id: comment.id,
            postId: comment.postId,
            authorId: comment.authorId,
            content: comment.content,
            parentId: comment.parentId,
            deleted: comment.deleted,
            createdAt: comment.createdAt,
        };
    }

    async createComment(userId: number, comment: CreateCommentDto): Promise<CommentDto> {
        const newComment = await this.commentRepository.createComment(new Comment(
            0,
            comment.postId,
            userId,
            comment.parentId,
            comment.content,
            false,
            new Date()
        ));
        if (newComment.id === 0) return new CommentDto();
        await this.auditService.log({ userId, action: "COMMENT_CREATED", details: "comments" });
        return this.toCommentDto(newComment);
    }

    async getPostComments(postId: number, page: number, limit: number): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByPostId(postId);
        return new PaginatedListDto(comments.map(c => this.toCommentDto(c)), totalAmount, page, limit);
    }

    async updateComment(userId: number, commentId: number, comment: UpdateCommentDto): Promise<boolean> {
        const existingComment = await this.commentRepository.findCommentById(commentId);
        if (existingComment.id === 0 || existingComment.authorId !== userId) return false;
        const updated = await this.commentRepository.updateComment(commentId, new Comment(
            commentId,
            comment.postId,
            userId,
            comment.parentId,
            comment.content,
            existingComment.deleted,
            existingComment.createdAt
        ));
        if (updated) {
            await this.auditService.log({ userId, action: "COMMENT_UPDATED", details: "comments" });
        }
        return updated;
    }

    async deleteComment(userId: number, commentId: number): Promise<boolean> {
        const existingComment = await this.commentRepository.findCommentById(commentId);
        if (existingComment.id === 0 || existingComment.authorId !== userId) return false;
        const deleted = await this.commentRepository.deleteComment(commentId);
        if (deleted) {
            await this.auditService.log({ userId, action: "COMMENT_DELETED", details: "comments" });
        }
        return deleted;
    }

}
