import { Comment } from "../../models/Comment";

export type CommentSortBy = 'createdAt' | 'likesCount';
export type SortOrder    = 'asc' | 'desc';

export interface ICommentRepository {
  createComment(comment: Comment): Promise<Comment>;

  // includeDeleted = true is needed when reconstructing thread context
  // (e.g. fetching a soft-deleted parent so a reply can still resolve who
  // it answers). Default keeps current behavior for normal lookups.
  findCommentById(commentId: number, includeDeleted?: boolean): Promise<Comment>;
  findCommentsByPostId(postId: number, page?: number, limit?: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByAuthorId(authorId: number, page?: number, limit?: number): Promise<{ comments: Comment[], totalAmount: number }>;
  findCommentsByParentId(parentId: number, page?: number, limit?: number, sortBy?: CommentSortBy, sortOrder?: SortOrder): Promise<{ comments: Comment[], totalAmount: number }>;
  hasChildComments(commentId: number): Promise<boolean>;

  updateComment(commentId: number, comment: Comment): Promise<boolean>;

  softDeleteComment(commentId: number): Promise<boolean>;
  reportComment(commentId: number): Promise<boolean>;
}