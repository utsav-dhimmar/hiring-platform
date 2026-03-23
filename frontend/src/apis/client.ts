import axios from "axios";
import { store } from "@/store";
import { setCredentials, logout } from "@/store/slices/authSlice";

/**
 * Axios HTTP client configured for the hiring platform API.
 * Includes authentication token injection and automatic 401 handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

/**
 * Pre-configured axios instance for API communication.
 * Automatically includes Authorization header with JWT token.
 * Clears tokens on 401 responses to handle session expiration.
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Request interceptor that adds JWT token to outgoing requests.
 * Retrieves token from localStorage and includes it in Authorization header.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Flag to prevent multiple simultaneous refresh token requests.
 */
let isRefreshing = false;

/**
 * Queue to store failed requests while a token refresh is in progress.
 */
let failedQueue: any[] = [];

/**
 * Processes the queue of failed requests after a token refresh attempt.
 * @param error - Error object if refresh failed, null otherwise
 * @param token - New access token if refresh succeeded, null otherwise
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Response interceptor that handles authentication errors.
 * Attempts to automatically refresh tokens on 401 Unauthorized responses.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and not already a retry or refresh attempt
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/users/refresh")
    ) {
      if (isRefreshing) {
        // If already refreshing, add request to queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        store.dispatch(logout());
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Use apiClient directly to avoid circular dependency with authService
        const response = await apiClient.post("/users/refresh", {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token, user } = response.data;

        // Update storage and Redux state
        store.dispatch(
          setCredentials({
            user,
            access_token,
            refresh_token,
          }),
        );

        processQueue(null, access_token);
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Default 401 handling if refresh is not possible
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }

    return Promise.reject(error);
  },
);

export default apiClient;
