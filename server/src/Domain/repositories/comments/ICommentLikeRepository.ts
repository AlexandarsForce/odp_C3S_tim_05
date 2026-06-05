import { CommentLike } from "../../models/CommentLike";

export interface ICommentLikeRepository {
  addCommentLike(commentId: number, like: CommentLike): Promise<CommentLike>;

isLikedByUser(commentId: number, userId: number): Promise<boolean>;

  updateCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  deleteCommentLike(commentId: number, userId: number): Promise<boolean>;
}