import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse, PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";
import type { AuditDto, DbNodeDto } from "../../types/admin/AdminTypes";
import type { UserDto } from "../../models/user/UserTypes";
import type { CommunityDto } from "../../types/community/CommunityTypes";
import type { PostDto } from "../../types/post/PostTypes";

export const adminApi = {
  // Health
  async getDbHealth() {
    return axios.get<ApiResponse<DbNodeDto[]>>(`${BASE}health/db`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<DbNodeDto[]>(e, "Failed to load DB health"));
  },
  async failover(idx: number) {
    return axios.post<ApiResponse<void>>(`${BASE}health/failover`, { idx }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failover failed"));
  },

  // Audit logs
  async getAuditLogs(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<AuditDto>>(`${BASE}audits/logs?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<AuditDto>>(e, "Failed to load audit logs"));
  },

  // Users (admin) — backend GET /users/all returns the full array (no pagination),
  // so we slice client-side here to keep the paginated UI working.
  async getAllUsers(page = 1, limit = 20): Promise<PaginatedResponse<UserDto>> {
    try {
      const r = await axios.get<ApiResponse<UserDto[]>>(`${BASE}users/all`, { headers: authHeader() });
      const all = r.data?.success && r.data.data ? r.data.data : [];
      const start = (page - 1) * limit;
      const items = all.slice(start, start + limit);
      return { success: true, message: "", data: { items, total: all.length, page, limit } };
    } catch (e) {
      return err<PaginatedData<UserDto>>(e, "Failed to load users");
    }
  },
  async updateUserRole(id: number, role: string) {
    return axios.put<ApiResponse<void>>(`${BASE}users/${id}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update role"));
  },
  async deleteUser(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}users/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete user"));
  },
  async deactivateUser(id: number) {
    return axios.patch<ApiResponse<void>>(`${BASE}users/${id}/deactivate`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to deactivate user"));
  },

  // Communities (admin)
  async getAllCommunities(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<CommunityDto>>(`${BASE}communities/all?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<CommunityDto>>(e, "Failed to load communities"));
  },
  async deleteCommunity(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}communities/${id}/admin`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete community"));
  },

  // Posts (admin)
  async getAllPosts(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<PostDto>>(`${BASE}posts/admin/all?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<PostDto>>(e, "Failed to load posts"));
  },
  async deletePost(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}posts/admin/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete post"));
  },
};
