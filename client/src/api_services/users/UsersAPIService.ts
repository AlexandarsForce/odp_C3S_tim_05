import axios from "axios";
import type { IUsersAPIService, ApiResponse } from "./IUsersAPIService";
import type { UserDto, UpdateUserInput, UserFollowerDto } from "../../models/user/UserTypes";
import type { PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";
import type { PostDto } from "../../types/post/PostTypes";
import type { CommentDto } from "../../types/comment/CommentTypes";
import { readItem } from "../../helpers/local_storage";

const BASE = import.meta.env.VITE_API_URL + "users";

const authHeader = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const err = <T, E>(e: E, fallback: string): ApiResponse<T> => ({
  success: false,
  message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
});

export const usersApi: IUsersAPIService & {
  getUserPosts: (id: number, page?: number, limit?: number) => Promise<PaginatedResponse<PostDto>>;
  getUserComments: (id: number, page?: number, limit?: number) => Promise<PaginatedResponse<CommentDto>>;
  getFollowers: (id: number, page?: number, limit?: number) => Promise<PaginatedResponse<UserFollowerDto>>;
  getFollowing: (id: number, page?: number, limit?: number) => Promise<PaginatedResponse<UserFollowerDto>>;
  follow: (targetId: number) => Promise<ApiResponse<void>>;
  unfollow: (targetId: number) => Promise<ApiResponse<void>>;
  removeFollower: (followerId: number) => Promise<ApiResponse<void>>;
  updateMe: (payload: UpdateUserInput) => Promise<ApiResponse<void>>;
} = {
  async getAll() {
    return axios.get<ApiResponse<UserDto[]>>(BASE, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to load users"));
  },
  async getById(id) {
    return axios.get<ApiResponse<UserDto>>(`${BASE}/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to load user"));
  },
  async deactivate(id) {
    return axios.patch<ApiResponse<void>>(`${BASE}/${id}/deactivate`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to deactivate user"));
  },

  async getUserPosts(id, page = 1, limit = 20) {
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}/${id}/posts?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load user posts"));
  },
  async getUserComments(id, page = 1, limit = 20) {
    return axios.get<PaginatedResponse<CommentDto>>(`${BASE}/${id}/comments?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<CommentDto>>(e, "Failed to load user comments"));
  },
  async getFollowers(id, page = 1, limit = 20) {
    return axios.get<PaginatedResponse<UserFollowerDto>>(`${BASE}/${id}/followers?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<UserFollowerDto>>(e, "Failed to load followers"));
  },
  async getFollowing(id, page = 1, limit = 20) {
    return axios.get<PaginatedResponse<UserFollowerDto>>(`${BASE}/${id}/following?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<UserFollowerDto>>(e, "Failed to load following"));
  },
  async follow(targetId) {
    return axios.post<ApiResponse<void>>(`${BASE}/${targetId}/follow`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to follow user"));
  },
  async unfollow(targetId) {
    return axios.delete<ApiResponse<void>>(`${BASE}/${targetId}/follow`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to unfollow user"));
  },
  async removeFollower(followerId) {
    return axios.delete<ApiResponse<void>>(`${BASE}/me/followers/${followerId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to remove follower"));
  },
  async updateMe(payload) {
    return axios.put<ApiResponse<void>>(`${BASE}/me`, payload, { headers: authHeader() })
      .then(r => r.data).catch(e => err<void>(e, "Failed to update profile"));
  },
};
