import { Comment } from "../../models/Comment";
import { CommentLike } from "../../models/CommentLike";

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;
  addCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  findCommentById(commentId: number): Promise<Comment>;
  findCommentsByPostId(postId: number): Promise<Comment[]>;
  findCommentsByAuthorId(authorId: number): Promise<Comment[]>;
  findCommentsByParentId(parentId: number): Promise<Comment[]>;
  findCommentLikesByCommentId(commentId: number): Promise<CommentLike[]>;
  findCommentLikesByUserId(userId: number): Promise<CommentLike[]>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;
  updateCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  deleteComment(commentId: number): Promise<boolean>;
  deleteCommentLike(commentId: number, userId: number): Promise<boolean>;
}