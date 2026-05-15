import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { CommentDto } from "../../DTOs/comments/CommentDto";
import { CreateCommentDto } from "../../DTOs/comments/CreateCommentDto";
import { UpdateCommentDto } from "../../DTOs/comments/UpdateCommentDto";

export interface ICommentService {
    createComment(userId: number, comment: CreateCommentDto): Promise<CommentDto>;

    getPostComments(postId: number, page: number, limit: number): Promise<PaginatedListDto<CommentDto>>;

    updateComment(userId: number, comment: UpdateCommentDto): Promise<boolean>;

    deleteComment(userId: number, commentId: number): Promise<boolean>;
}