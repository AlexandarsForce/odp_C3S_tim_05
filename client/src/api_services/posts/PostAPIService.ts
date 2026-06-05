import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse, PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";
import type { PostDto, CreatePostInput, UpdatePostInput } from "../../types/post/PostTypes";

export const postApi = {
  async getByCommunity(communityId: number, page = 1, limit = 20) {
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}posts/community/${communityId}?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load posts"));
  },
  async getFeed(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}posts/feed?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load feed"));
  },
  async getById(id: number) {
    return axios.get<ApiResponse<PostDto>>(`${BASE}posts/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PostDto>(e, "Failed to load post"));
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
};
