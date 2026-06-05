import { CommentLikeDto } from "../../DTOs/comments/CommentLikeDto";
import { CreateCommentLikeDto } from "../../DTOs/comments/CreateCommentLikeDto";

export interface ICommentLikeService {
    likeComment(userId: number, commentId: number, commentLike: CreateCommentLikeDto): Promise<CommentLikeDto>;

unlikeComment(userId: number, commentId: number): Promise<boolean>;
}