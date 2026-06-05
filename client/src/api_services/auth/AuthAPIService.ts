import axios from "axios";
import type { AuthResponse } from "../../types/auth/AuthResponse";
import type { IAuthAPIService } from "./IAuthAPIService";

const BASE = import.meta.env.VITE_API_URL + "auth";

const err = (e: unknown, fallback: string): AuthResponse => {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string; field?: string } | undefined;
    return { success: false, message: data?.message ?? fallback, field: data?.field };
  }
  return { success: false, message: fallback };
};

export const authApi: IAuthAPIService = {
  async login(username, password) {
    return axios.post<AuthResponse>(`${BASE}/login`, { username, password })
      .then(r => r.data).catch(e => err(e, "Login failed"));
  },

  async register(username, fullname, email, password, bio, profilePicture, role) {
    const fd = new FormData();
    fd.append("username", username);
    fd.append("fullname", fullname);
    fd.append("email", email);
    fd.append("password", password);
    fd.append("bio", bio);
    fd.append("role", role);
    if (profilePicture) fd.append("profilePicture", profilePicture);
    return axios.post<AuthResponse>(`${BASE}/register/multipart`, fd)
      .then(r => r.data).catch(e => err(e, "Registration failed"));
  },

  async logout(token) {
    await axios.post(`${BASE}/logout`, {}, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  },
};
