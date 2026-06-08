import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse, PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";

export type CommentDto = {
  id: number;
  postId: number;
  authorId: number;
  authorUsername?: string;
  parentId: number | null;
  content: string;
  deleted: boolean;
  createdAt: string;
  reported: boolean;
  likesCount: number;
};

export type CreateCommentInput = {
  postId: number;
  content: string;
  parentId?: number;
};

export const commentApi = {
  async getPostComments(postId: number, page = 1, limit = 50) {
    return axios.get<PaginatedResponse<CommentDto>>(
      `${BASE}posts/${postId}/comments?page=${page}&limit=${limit}`,
      { headers: authHeader() }
    )
      .then(r => r.data)
      .catch(e => err<PaginatedData<CommentDto>>(e, "Failed to load comments"));
  },

  async create(postId: number, content: string, parentId?: number) {
    return axios.post<ApiResponse<CommentDto>>(`${BASE}posts/${postId}/comments`, { content, parentId }, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<CommentDto>(e, "Failed to create comment"));
  },

  async update(id: number, content: string) {
    return axios.put<ApiResponse<void>>(`${BASE}comments/${id}`, { content }, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<void>(e, "Failed to update comment"));
  },

  async delete(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}comments/${id}`, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<void>(e, "Failed to delete comment"));
  },

  async like(commentId: number) {
    return axios.post<ApiResponse<void>>(`${BASE}comments/${commentId}/like`, {}, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<void>(e, "Failed to like comment"));
  },

  async unlike(commentId: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}comments/${commentId}/like`, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<void>(e, "Failed to unlike comment"));
  },

  async report(commentId: number) {
    return axios.post<ApiResponse<void>>(`${BASE}comments/${commentId}/report`, {}, { headers: authHeader() })
      .then(r => r.data)
      .catch(e => err<void>(e, "Failed to report comment"));
  },
};
