import { Comment } from "../../models/Comment";
import { CommentLike } from "../../models/CommentLike";

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;
  addCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  findCommentById(commentId: number): Promise<Comment>;
  findCommentsByPostId(postId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByAuthorId(authorId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByParentId(parentId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentLikesByCommentId(commentId: number): Promise<{ likes: CommentLike[], totalAmount: number }>;
  findCommentLikesByUserId(userId: number): Promise<{ likes: CommentLike[], totalAmount: number }>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;
  updateCommentLike(commentId: number, like: CommentLike): Promise<boolean>;

  deleteComment(commentId: number): Promise<boolean>;
  deleteCommentLike(commentId: number, userId: number): Promise<boolean>;
}