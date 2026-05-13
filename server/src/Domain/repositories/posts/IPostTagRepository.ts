import { PostTag } from "../../models/PostTag";

export interface IPostTagRepository {
    addPostTag(postId: number, tag: PostTag): Promise<boolean>;

    findPostTagsByPostId(postId: number): Promise<{ tags: PostTag[], totalAmount: number }>;

    updatePostTag(postId: number, tagId: number, tag: PostTag): Promise<boolean>;
    
    deletePostTag(postId: number, tagId: number): Promise<boolean>;
}