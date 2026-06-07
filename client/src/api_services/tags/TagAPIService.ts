import axios from "axios";
import { BASE, authHeader, err } from "../common/apiHelper";
import type { ApiResponse } from "../../types/common/ApiResponse";
import type { TagDto } from "../../types/tag/TagTypes";

export const tagApi = {
  async getAll() {
    return axios.get<ApiResponse<TagDto[]>>(`${BASE}tags`, { headers: authHeader() })
      .then(r => r.data).catch(e => err<TagDto[]>(e, "Failed to load tags"));
  },
  async create(name: string) {
    return axios.post<ApiResponse<TagDto>>(`${BASE}tags`, { name }, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to create tag"));
  },
  async delete(id: number) {
    return axios.delete<ApiResponse<void>>(`${BASE}tags/${id}`, { headers: authHeader() })
      .then(r => r.data).catch(e => err(e, "Failed to delete tag"));
  },
};
