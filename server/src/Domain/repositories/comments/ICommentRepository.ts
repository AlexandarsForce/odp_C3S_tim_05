import { Comment } from "../../models/Comment";

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;

  findCommentById(commentId: number): Promise<Comment>;
  findCommentsByPostId(postId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByAuthorId(authorId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByParentId(parentId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  hasChildComments(commentId: number): Promise<boolean>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;

  softDeleteComment(commentId: number): Promise<boolean>;
  deleteComment(commentId: number): Promise<boolean>;
}