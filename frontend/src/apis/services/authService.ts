import apiClient from "../client";
import type {
  UserLogin,
  LoginResponse,
  UserCreate,
  UserRead,
} from "../types/auth";

export const authService = {
  login: async (credentials: UserLogin): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/users/login",
      credentials,
    );
    return response.data;
  },

  register: async (userIn: UserCreate): Promise<UserRead> => {
    const response = await apiClient.post<UserRead>("/users/", userIn);
    return response.data;
  },

  getUser: async (userId: string): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>(`/users/${userId}`);
    return response.data;
  },
};
