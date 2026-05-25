import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { PostLikeDto } from "../../DTOs/posts/PostLikeDto";
import { CreatePostLikeDto } from "../../DTOs/posts/CreatePostLikeDto";

export interface IPostLikeService {
    likePost(userId: number, postId: number, postLike: CreatePostLikeDto): Promise<PostLikeDto>;
    unlikePost(userId: number, postId: number): Promise<boolean>;

    getPostLikes(userId: number, postId: number, page: number, limit: number): Promise<PaginatedListDto<PostLikeDto>>;
}