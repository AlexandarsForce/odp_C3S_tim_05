import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { PostLikeDto } from "../../DTOs/posts/PostLikeDto";
import { CreatePostLikeDto } from "../../DTOs/posts/CreatePostLikeDto";

export type LikePostResult =
    | { success: true;  data: PostLikeDto }
    | { success: false; reason: 'DUPLICATE' | 'OWN_POST' | 'ERROR' };

export interface IPostLikeService {
    likePost(userId: number, postId: number, postLike: CreatePostLikeDto): Promise<LikePostResult>;
    unlikePost(userId: number, postId: number): Promise<boolean>;

    getPostLikes(userId: number, postId: number, page: number, limit: number): Promise<PaginatedListDto<PostLikeDto>>;
    isLikedByUser(userId: number, postId: number): Promise<boolean>;
}
