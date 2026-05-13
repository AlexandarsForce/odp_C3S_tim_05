import { Comment } from "../../models/Comment";

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;

  findCommentById(commentId: number): Promise<Comment>;
  findCommentsByPostId(postId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByAuthorId(authorId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByParentId(parentId: number): Promise<{ comments: Comment[], totalAmount: number }>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;

  deleteComment(commentId: number): Promise<boolean>;
}