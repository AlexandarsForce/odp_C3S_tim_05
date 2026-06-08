import { PaginatedListDto } from "../../Domain/DTOs/entity/PaginatedListDto";
import { CommentDto } from "../../Domain/DTOs/comments/CommentDto";
import { CreateCommentDto } from "../../Domain/DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../Domain/DTOs/comments/UpdateCommentDto";
import { ICommentService } from "../../Domain/services/comments/ICommentService";
import { ICommentRepository, CommentSortBy, SortOrder } from "../../Domain/repositories/comments/ICommentRepository";
import { IPostRepository } from "../../Domain/repositories/posts/IPostRepository";
import { ICommunityMemberRepository } from "../../Domain/repositories/communities/ICommunityMemberRepository";
import { IUserRepository } from "../../Domain/repositories/users/IUserRepository";
import { IAuditService } from "../../Domain/services/audit/IAuditService";
import { Comment } from "../../Domain/models/Comment";
import { UserRole } from "../../Domain/enums/UserRole";
import { CommunityMemberRole } from "../../Domain/enums/CommunityMemberRole";
import { CommunityMemberStatus } from "../../Domain/enums/CommunityMemberStatus";
import { parseMentions } from "../../Domain/utils/parseMentions";

const SOFT_DELETED_CONTENT = "[deleted]";
const MAX_DEPTH = 2;

export class CommentService implements ICommentService {
    constructor(
        private commentRepository: ICommentRepository,
        private auditService: IAuditService,
        private userRepository: IUserRepository,
        private postRepository: IPostRepository,
        private communityMemberRepository: ICommunityMemberRepository,
    ) {}

    async toCommentDto(comment: Comment): Promise<CommentDto> {
        const mentions = comment.deleted
            ? []
            : await parseMentions(comment.content, this.userRepository);
        return {
            id: comment.id,
            postId: comment.postId,
            authorId: comment.authorId,
            authorUsername: comment.authorUsername || undefined,
            content: comment.content,
            parentId: comment.parentId,
            deleted: comment.deleted,
            createdAt: comment.createdAt,
            mentions,
            reported: comment.reported,
            likesCount: comment.likesCount ?? 0,
        };
    }

    async createComment(userId: number, comment: CreateCommentDto): Promise<CommentDto> {
        if (comment.parentId !== null && comment.parentId !== undefined) {
            const parent = await this.commentRepository.findCommentById(comment.parentId);

            if (parent.id === 0) return new CommentDto();

            if (parent.postId !== comment.postId) return new CommentDto();

            if (parent.parentId !== null && parent.parentId !== undefined) {
                const grandparent = await this.commentRepository.findCommentById(parent.parentId);
                if (grandparent.id === 0) return new CommentDto();
                if (grandparent.parentId !== null && grandparent.parentId !== undefined) {
                    return new CommentDto();
                }
            }
        }

        const newComment = await this.commentRepository.createComment(new Comment(
            0,
            comment.postId,
            userId,
            comment.parentId ?? null,
            comment.content,
            false,
            new Date()
        ));
        if (newComment.id === 0) return new CommentDto();
        await this.auditService.log({ userId, action: "COMMENT_CREATED", details: "comments" });
        return this.toCommentDto(newComment);
    }

    async getPostComments(postId: number, page: number, limit: number, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByPostId(postId, page, limit, sortBy, sortOrder);
        const dtos = await Promise.all(comments.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async getUserComments(authorId: number, page: number, limit: number): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByAuthorId(authorId);
        const paged = comments.slice((page - 1) * limit, page * limit);
        const dtos = await Promise.all(paged.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async getCommentReplies(parentId: number, page: number, limit: number, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByParentId(parentId, page, limit, sortBy, sortOrder);
        const dtos = await Promise.all(comments.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async updateComment(userId: number, commentId: number, comment: UpdateCommentDto): Promise<boolean> {
        const existingComment = await this.commentRepository.findCommentById(commentId);
        if (existingComment.id === 0 || existingComment.authorId !== userId) return false;
        if (existingComment.content === SOFT_DELETED_CONTENT) return false;
        const updated = await this.commentRepository.updateComment(commentId, new Comment(
            commentId,
            existingComment.postId,
            userId,
            existingComment.parentId,
            comment.content,
            existingComment.deleted,
            existingComment.createdAt
        ));
        if (updated) {
            await this.auditService.log({ userId, action: "COMMENT_UPDATED", details: "comments" });
        }
        return updated;
    }

    async reportComment(actorId: number, commentId: number): Promise<boolean> {
        const comment = await this.commentRepository.findCommentById(commentId);
        if (comment.id === 0) return false;

        const post = await this.postRepository.findPostById(comment.postId);
        if (post.id === 0) return false;

        const membership = await this.communityMemberRepository.findCommunityMemberById(post.communityId, actorId);
        const isModerator = membership.userId !== 0
            && membership.role === CommunityMemberRole.MODERATOR
            && membership.status === CommunityMemberStatus.ACTIVE;

        if (!isModerator) return false;

        const success = await this.commentRepository.reportComment(commentId);
        if (success) await this.auditService.log({ userId: actorId, action: "COMMENT_REPORTED", details: `commentId: ${commentId}` });
        return success;
    }

    async deleteComment(userId: number, commentId: number): Promise<boolean> {
        const existingComment = await this.commentRepository.findCommentById(commentId);
        if (existingComment.id === 0 || existingComment.authorId !== userId) return false;

        const success = await this.commentRepository.softDeleteComment(commentId);

        if (success) {
            await this.auditService.log({ userId, action: "COMMENT_DELETED", details: "comments" });
        }
        return success;
    }
}
