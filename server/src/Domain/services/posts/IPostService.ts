import { PaginatedListDto } from "../../DTOs/utils/PaginatedListDto";
import { PostDto } from "../../DTOs/posts/PostDto";
import { CreatePostDto } from "../../DTOs/posts/CreatePostDto";
import { UpdatePostDto } from "../../DTOs/posts/UpdatePostDto";

export interface PostQueryFilters {
  sortBy?: 'createdAt' | 'title' | 'likesCount' | 'commentsCount';
  sortOrder?: 'asc' | 'desc';
  tagId?: number;
  authorId?: number;
}

export interface IPostService {
    createPost(userId: number, post: CreatePostDto): Promise<PostDto>;

    getAllPosts(communityId: number, page: number, limit: number, filters?: PostQueryFilters): Promise<PaginatedListDto<PostDto>>;
    getPostsByAuthor(authorId: number, page: number, limit: number): Promise<PaginatedListDto<PostDto>>;
    getFeed(userId: number, page: number, limit: number): Promise<PaginatedListDto<PostDto>>;
    getPostDetails(postId: number): Promise<PostDto>;

    updatePost(userId: number, postId: number, post: UpdatePostDto): Promise<boolean>;

    deletePost(userId: number, postId: number): Promise<boolean>;

    adminGetAllPosts(page: number, limit: number): Promise<PaginatedListDto<PostDto>>;
    adminDeletePost(postId: number): Promise<boolean>;
}