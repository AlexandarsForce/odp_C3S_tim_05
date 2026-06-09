import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse, PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";
import type {
  PostDto,
  CreatePostInput,
  UpdatePostInput,
  PostSortBy,
  PostSortOrder,
} from "../../types/post/PostTypes";

type GetByCommunityOpts = {
  page?: number;
  limit?: number;
  sortBy?: PostSortBy;
  sortOrder?: PostSortOrder;
};

export type RestrictedPostInfo = {
  community: { id: number; name: string; type: string };
  post: { id: number; title: string; authorUsername: string; createdAt: string };
};

type PostDetailResponse = ApiResponse<PostDto> & {
  isLiked?: boolean;
  restricted?: boolean;
  community?: RestrictedPostInfo["community"];
  post?: RestrictedPostInfo["post"];
};

export const postApi = {
  async getByCommunity(communityId: number, opts: GetByCommunityOpts = {}) {
    const { page = 1, limit = 20, sortBy, sortOrder } = opts;
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}posts/community/${communityId}?${params.toString()}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load posts"));
  },
  async getFeed(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}posts/feed?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load feed"));
  },
  async getById(id: number): Promise<PostDetailResponse> {
    try {
      const r = await axios.get<PostDetailResponse>(`${BASE}posts/${id}`, { headers: authHeader() });
      return r.data;
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 403 && e.response.data?.restricted) {
        return e.response.data as PostDetailResponse;
      }
      return err<PostDto>(e, "Failed to load post") as PostDetailResponse;
    }
  },
  async create(payload: CreatePostInput) {
    return axios.post<ApiResponse<PostDto>>(`${BASE}posts`, payload, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PostDto>(e, "Failed to create post"));
  },
  async update(id: number, payload: UpdatePostInput) {
    return axios.put<ApiResponse<void>>(`${BASE}posts/${id}`, payload, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to update post"));
  },
  async delete(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}posts/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to delete post"));
  },
  async addTag(postId: number, tagId: number) {
    return axios.post<ApiResponse<void>>(`${BASE}posts/${postId}/tags`, { tagId }, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to add tag"));
  },
  async removeTag(postId: number, tagId: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}posts/${postId}/tags/${tagId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to remove tag"));
  },
  async like(postId: number) {
    return axios.post<ApiResponse<void>>(`${BASE}posts/${postId}/like`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to like post"));
  },
  async unlike(postId: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}posts/${postId}/like`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to unlike post"));
  },
};
