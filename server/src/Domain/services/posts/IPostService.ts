import { PaginatedListDto } from "../../DTOs/entity/PaginatedListDto";
import { PostDto } from "../../DTOs/posts/PostDto";
import { CreatePostDto } from "../../DTOs/posts/CreatePostDto";
import { UpdatePostDto } from "../../DTOs/posts/UpdatePostDto";

export interface PostQueryFilters {
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
  tagId?: number;
  authorId?: number;
}

export interface IPostService {
    createPost(userId: number, post: CreatePostDto): Promise<PostDto>;

    getAllPosts(communityId: number, page: number, limit: number, filters?: PostQueryFilters): Promise<PaginatedListDto<PostDto>>;
    getFeed(userId: number, page: number, limit: number): Promise<PaginatedListDto<PostDto>>;
    getPostDetails(postId: number): Promise<PostDto>;

    updatePost(userId: number, postId: number, post: UpdatePostDto): Promise<boolean>;

    deletePost(userId: number, postId: number): Promise<boolean>;
}