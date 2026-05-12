import { Post } from "../../models/Post";
import { PostLike } from "../../models/PostLike";
import { PostTag } from "../../models/PostTag";

export interface IPostRepository {
  createPost(post: Post): Promise<Post>;
  addPostLike(postId: number, like: PostLike): Promise<boolean>;
  addPostTag(postId: number, tag: PostTag): Promise<boolean>;

  findPostById(postId: number): Promise<Post>;
  findPostsByCommunityId(communityId: number): Promise<Post[]>;
  findPostsByAuthorId(authorId: number): Promise<Post[]>;
  findPostLikesByPostId(postId: number): Promise<PostLike[]>;
  findPostsByTagId(tagId: number): Promise<Post[]>;
  findPostsByTagName(tagName: string): Promise<Post[]>;
  findPostTagsByPostId(postId: number): Promise<PostTag[]>;

  updatePost(postId: number, post: Post): Promise<boolean>;
  updatePostLike(postId: number, like: PostLike): Promise<boolean>;

  deletePost(postId: number): Promise<boolean>;
  deletePostLike(postId: number, userId: number): Promise<boolean>;
  deletePostTag(postId: number, tagId: number): Promise<boolean>;
}