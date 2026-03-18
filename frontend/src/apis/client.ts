import axios from 'axios';

/**
 * Axios HTTP client configured for the hiring platform API.
 * Includes authentication token injection and automatic 401 handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

/**
 * Pre-configured axios instance for API communication.
 * Automatically includes Authorization header with JWT token.
 * Clears tokens on 401 responses to handle session expiration.
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor that adds JWT token to outgoing requests.
 * Retrieves token from localStorage and includes it in Authorization header.
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor that handles authentication errors.
 * Clears tokens from localStorage on 401 Unauthorized responses.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
