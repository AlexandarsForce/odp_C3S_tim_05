import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { CommentLikeDto } from "../../DTOs/comments/CommentLikeDto";
import { CreateCommentLikeDto } from "../../DTOs/comments/CreateCommentLikeDto";

export interface ICommentLikeService {
    likeComment(userId: number, commentId: number, commentLike: CreateCommentLikeDto): Promise<CommentLikeDto>;

    getCommentLikes(userId: number, commentId: number): Promise<PaginatedListDto<CommentLikeDto>>;

    unlikeComment(userId: number, commentId: number): Promise<boolean>;
}