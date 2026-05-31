import { Comment } from "../../models/Comment";

export type CommentSortBy = 'createdAt' | 'likesCount';
export type SortOrder    = 'asc' | 'desc';

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;

  findCommentById(commentId: number): Promise<Comment>;
  findCommentsByPostId(postId: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByAuthorId(authorId: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByParentId(parentId: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<{ comments: Comment[], totalAmount: number }>;
  hasChildComments(commentId: number): Promise<boolean>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;

  softDeleteComment(commentId: number): Promise<boolean>;
  reportComment(commentId: number): Promise<boolean>;
}