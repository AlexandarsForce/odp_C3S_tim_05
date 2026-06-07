import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse, PaginatedData, PaginatedResponse } from "../../types/common/ApiResponse";
import type { CommunityDto, CommunityMemberDto, CreateCommunityDto } from "../../types/community/CommunityTypes";

export type CommunityDetailsResponse = ApiResponse<CommunityDto> & {
  members?: PaginatedData<CommunityMemberDto>;
};

export const communityApi = {
  async getAll(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<CommunityDto>>(`${BASE}communities?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<CommunityDto>>(e, "Failed to load communities"));
  },
  async getMine(page = 1, limit = 20) {
    return axios.get<PaginatedResponse<CommunityDto>>(`${BASE}communities/mine?page=${page}&limit=${limit}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<PaginatedData<CommunityDto>>(e, "Failed to load your communities"));
  },
  async getById(id: number, memberLimit = 5): Promise<CommunityDetailsResponse> {
    try {
      const r = await axios.get(`${BASE}communities/${id}?limit=${memberLimit}`, { headers: authHeader() });
      const body = r.data as { success: boolean; message?: string; data?: CommunityDto; members?: PaginatedData<CommunityMemberDto> };
      return {
        success: body.success,
        message: body.message ?? "",
        data: body.data,
        members: body.members,
      };
    } catch (e) {
      return {
        success: false,
        message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? "Failed to load community" : "Failed to load community",
      };
    }
  },
  async create(payload: CreateCommunityDto) {
    return axios.post<ApiResponse<CommunityDto>>(`${BASE}communities`, payload, { headers: authHeader() })
      .then(r => r.data).catch(e => err<CommunityDto>(e, "Failed to create community"));
  },
  async update(id: number, payload: Partial<CreateCommunityDto>) {
    return axios.put<ApiResponse<void>>(`${BASE}communities/${id}`, payload, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update community"));
  },
  async delete(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}communities/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete community"));
  },
  async join(id: number) {
    return axios.post<ApiResponse<void>>(`${BASE}communities/${id}/join`, {}, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to join community"));
  },
  async leave(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}communities/${id}/leave`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to leave community"));
  },

  async updateMemberRole(communityId: number, userId: number, role: string) {
    return axios.patch<ApiResponse<void>>(`${BASE}communities/${communityId}/members/${userId}/role`, { role }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to update member role"));
  },
  async updateMemberStatus(communityId: number, userId: number, accepted: boolean) {
    return axios.patch<ApiResponse<void>>(`${BASE}communities/${communityId}/members/${userId}/status`, { accepted }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to respond to request"));
  },
  async removeMember(communityId: number, userId: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}communities/${communityId}/members/${userId}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to remove member"));
  },
};
