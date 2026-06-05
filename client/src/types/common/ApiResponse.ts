export type ApiResponse<T> = { success: boolean; message: string; data?: T };

export type PaginatedData<T> = { items: T[]; total: number; page?: number; limit?: number };

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>;
