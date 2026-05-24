import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { PostTagDto } from "../../DTOs/posts/PostTagDto";
import { CreatePostTagDto } from "../../DTOs/posts/CreatePostTagDto";

export interface IPostTagService {
    addPostTag(userId: number, postId: number, postTag: CreatePostTagDto): Promise<PostTagDto>;

    getPostTags(userId: number, postId: number, page: number, limit: number): Promise<PaginatedListDto<PostTagDto>>;

    removePostTag(userId: number, postId: number, tagId: number): Promise<boolean>;
}