import apiClient from "../client";
import type {
  UserLogin,
  LoginResponse,
  UserCreate,
  UserRead,
} from "../types/auth";

/**
 * Authentication service for user login, registration, and profile management.
 * Provides methods for communicating with the authentication API endpoints.
 */
export const authService = {
  /**
   * Authenticates a user with email and password.
   * @param credentials - User login credentials
   * @returns Promise resolving to login response with tokens and user data
   * @throws {Error} When credentials are invalid or server returns an error
   * @example
   * ```ts
   * const response = await authService.login({ email: "user@example.com", password: "password123" });
   * console.log(response.access_token);
   * ```
   */
  login: async (credentials: UserLogin): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/users/login",
      credentials,
    );
    return response.data;
  },

  /**
   * Registers a new user account.
   * @param userIn - User creation data
   * @returns Promise resolving to the created user's data
   * @throws {Error} When email is already taken or validation fails
   */
  register: async (userIn: UserCreate): Promise<UserRead> => {
    const response = await apiClient.post<UserRead>("/users/", userIn);
    return response.data;
  },

  /**
   * Retrieves a user's profile information by ID.
   * @param userId - The unique identifier of the user
   * @returns Promise resolving to the user's profile data
   * @throws {Error} When user is not found
   */
  getUser: async (userId: string): Promise<UserRead> => {
    const response = await apiClient.get<UserRead>(`/users/${userId}`);
    return response.data;
  },
};
