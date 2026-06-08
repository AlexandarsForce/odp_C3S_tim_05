import axios from "axios";
import { readItem } from "../../helpers/local_storage";
import type { ApiResponse } from "../../types/common/ApiResponse";

export const BASE = import.meta.env.VITE_API_URL;

export const authHeader = () => {
  const token = readItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const err = <T, E = unknown>(e: E, fallback: string): ApiResponse<T> => ({
  success: false,
  message: axios.isAxiosError(e) ? (e.response?.data as { message?: string })?.message ?? fallback : fallback,
});
