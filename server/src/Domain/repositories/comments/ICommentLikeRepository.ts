import { CommentLike } from "../../models/CommentLike";

export interface ICommentLikeRepository {
  addCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  findCommentLikesByCommentId(commentId: number): Promise<{ likes: CommentLike[], totalAmount: number }>;
  findCommentLikesByUserId(userId: number): Promise<{ likes: CommentLike[], totalAmount: number }>;

  updateCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  deleteCommentLike(commentId: number, userId: number): Promise<boolean>;
}