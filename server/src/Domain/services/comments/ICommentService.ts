import { PaginatedListDto } from "../../DTOs/utils/PaginatedListDto";
import { CommentDto } from "../../DTOs/comments/CommentDto";
import { CreateCommentDto } from "../../DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../DTOs/comments/UpdateCommentDto";
import { CommentSortBy, SortOrder } from "../../repositories/comments/ICommentRepository";

export interface ICommentService {
    createComment(userId: number, comment: CreateCommentDto): Promise<CommentDto>;

    getPostComments(postId: number, page: number, limit: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<PaginatedListDto<CommentDto>>;
    
    getUserComments(authorId: number, page: number, limit: number): Promise<PaginatedListDto<CommentDto>>;

    getCommentReplies(parentId: number, page: number, limit: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<PaginatedListDto<CommentDto>>;

    updateComment(userId: number, commentId: number, comment: UpdateCommentDto): Promise<boolean>;

    deleteComment(userId: number, commentId: number): Promise<boolean>;
    reportComment(actorId: number, commentId: number): Promise<boolean>;
}