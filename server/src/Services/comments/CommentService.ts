import { PaginatedListDto } from "../../Domain/DTOs/utils/PaginatedListDto";
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
import { SOFT_DELETED_COMMENT_CONTENT, COMMENT_MAX_DEPTH } from "../../Domain/constants/Constants";

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
            authorUsername: comment.authorUsername,
            content: comment.content,
            parentId: comment.parentId,
            deleted: comment.deleted,
            createdAt: comment.createdAt,
            mentions,
            reported: comment.reported,
            likesCount: comment.likesCount ?? 0,
            authorProfilePicture: comment.authorProfilePicture ?? "",
        };
    }

    async createComment(userId: number, comment: CreateCommentDto): Promise<CommentDto> {
        // Walk up the parent chain to (a) validate the post matches at every level
        // and (b) reject anything that would push the new comment past COMMENT_MAX_DEPTH.
        // Depth = number of ancestors; root has depth 0.
        if (comment.parentId && comment.parentId !== 0) {
            let depth = 0;
            let currentParentId: number | undefined = comment.parentId;

            while (currentParentId && currentParentId !== 0) {
                const ancestor = await this.commentRepository.findCommentById(currentParentId);
                if (ancestor.id === 0) return new CommentDto();
                if (ancestor.postId !== comment.postId) return new CommentDto();

                depth++;
                if (depth > COMMENT_MAX_DEPTH) return new CommentDto();

                currentParentId = ancestor.parentId;
            }
        }

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

        const author = await this.userRepository.findById(userId);
        newComment.authorUsername = author.username ?? "";
        newComment.authorProfilePicture = author.profilePicture ?? "";

        await this.auditService.log({ userId, action: "COMMENT_CREATED", details: "comments" });
        return this.toCommentDto(newComment);
    }

    async getPostComments(postId: number, page: number, limit: number, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByPostId(postId, page, limit, sortBy, sortOrder);
        const dtos = await Promise.all(comments.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async getUserComments(authorId: number, page: number, limit: number): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByAuthorId(authorId, page, limit);
        const dtos = await Promise.all(comments.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async getCommentReplies(parentId: number, page: number, limit: number, sortBy: CommentSortBy = 'createdAt', sortOrder: SortOrder = 'asc'): Promise<PaginatedListDto<CommentDto>> {
        const { comments, totalAmount } = await this.commentRepository.findCommentsByParentId(parentId, page, limit, sortBy, sortOrder);
        const dtos = await Promise.all(comments.map(c => this.toCommentDto(c)));
        return new PaginatedListDto(dtos, totalAmount, page, limit);
    }

    async updateComment(userId: number, commentId: number, comment: UpdateCommentDto): Promise<boolean> {
        // Pass includeDeleted=true so we can detect (and reject) edits on a comment
        // that's already been soft-deleted, instead of silently treating it as "not found".
        const existingComment = await this.commentRepository.findCommentById(commentId, true);
        if (existingComment.id === 0 || existingComment.authorId !== userId) return false;
        // Authoritative check is the `deleted` flag; content comparison kept as a
        // secondary guard in case the flag is ever wrong while content matches.
        if (existingComment.deleted) return false;
        if (existingComment.content === SOFT_DELETED_COMMENT_CONTENT) return false;
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

        // Any authenticated user can flag a comment. Moderators and admins still see
        // the reported flag in their dashboards; this just opens the funnel so regular
        // users can surface bad content.
        const success = await this.commentRepository.reportComment(commentId);
        if (success) await this.auditService.log({ userId: actorId, action: "COMMENT_REPORTED", details: `commentId: ${commentId}` });
        return success;
    }

    async deleteComment(userId: number, commentId: number): Promise<boolean> {
        const existingComment = await this.commentRepository.findCommentById(commentId);
        if (existingComment.id === 0) return false;

        // Author can always delete their own comment.
        const isAuthor = existingComment.authorId === userId;
        if (isAuthor) {
            const success = await this.commentRepository.softDeleteComment(commentId);
            if (success) await this.auditService.log({ userId, action: "COMMENT_DELETED", details: "comments" });
            return success;
        }

        // Moderators of the post's community can also delete.
        const post = await this.postRepository.findPostById(existingComment.postId);
        if (post.id === 0) return false;

        const membership = await this.communityMemberRepository.findCommunityMemberById(post.communityId, userId);
        const isModerator = membership.userId !== 0
            && membership.role === CommunityMemberRole.MODERATOR
            && membership.status === CommunityMemberStatus.ACTIVE;
        if (!isModerator) return false;

        const success = await this.commentRepository.softDeleteComment(commentId);
        if (success) await this.auditService.log({ userId, action: "COMMENT_DELETED", details: "comments" });
        return success;
    }
}
