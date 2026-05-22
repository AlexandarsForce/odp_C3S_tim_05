import { PostTag } from "../../models/PostTag";

export interface IPostTagRepository {
    addPostTag(postId: number, tag: PostTag): Promise<PostTag>;

    findPostTagsByPostId(postId: number): Promise<{ tags: PostTag[], totalAmount: number }>;
    
    deletePostTag(postId: number, tagId: number): Promise<boolean>;
}