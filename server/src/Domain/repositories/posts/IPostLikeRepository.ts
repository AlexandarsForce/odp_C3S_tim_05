import { PostLike } from "../../models/PostLike";

export interface IPostLikeRepository {
  addPostLike(postId: number, like: PostLike): Promise<boolean>;

  findPostLikesByPostId(postId: number): Promise<{ likes: PostLike[], totalAmount: number }>;

  updatePostLike(postId: number, like: PostLike): Promise<boolean>;
  
  deletePostLike(postId: number, userId: number): Promise<boolean>;
}