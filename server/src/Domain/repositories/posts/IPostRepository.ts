import { Post } from "../../models/Post";
import { PostLike } from "../../models/PostLike";
import { PostTag } from "../../models/PostTag";

export interface IPostRepository {
  createPost(post: Post): Promise<Post>;
  addPostLike(postId: number, like: PostLike): Promise<boolean>;
  addPostTag(postId: number, tag: PostTag): Promise<boolean>;

  findPostById(postId: number): Promise<Post>;
  findPostsByCommunityId(communityId: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostsByAuthorId(authorId: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostLikesByPostId(postId: number): Promise<{ likes: PostLike[], totalAmount: number }>;
  findPostsByTagId(tagId: number): Promise<{ posts: Post[], totalAmount: number }>;
  findPostsByTagName(tagName: string): Promise<{ posts: Post[], totalAmount: number }>;
  findPostTagsByPostId(postId: number): Promise<{ tags: PostTag[], totalAmount: number }>;

  updatePost(postId: number, post: Post): Promise<boolean>;
  updatePostLike(postId: number, like: PostLike): Promise<boolean>;

  deletePost(postId: number): Promise<boolean>;
  deletePostLike(postId: number, userId: number): Promise<boolean>;
  deletePostTag(postId: number, tagId: number): Promise<boolean>;
}