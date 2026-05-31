import { Post } from "../../models/Post";

export interface PostFilters {
  sortBy?: 'createdAt' | 'title' | 'likesCount' | 'commentsCount';
  sortOrder?: 'asc' | 'desc';
  tagId?: number;
  authorId?: number;
}

export interface IPostRepository {
  createPost(post: Post): Promise<Post>;

  findPostById(postId: number): Promise<Post>;
  findPostsByCommunityId(communityId: number, page: number, limit: number, filters?: PostFilters): Promise<{ posts: Post[], totalAmount: number }>;
  findFeedPosts(userId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostsByAuthorId(authorId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostsByTagId(tagId: number, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostsByTagName(tagName: string, page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }>;
  findAllPosts(page: number, limit: number): Promise<{ posts: Post[], totalAmount: number }>;

  updatePost(postId: number, post: Post): Promise<boolean>;

  deletePost(postId: number): Promise<boolean>;
}