/**
 * Authentication slice for Redux state management.
 * Manages user session, tokens, and authentication status.
 */

import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { UserRead } from "@/types/auth";

/**
 * Shape of the authentication state in Redux store.
 */
interface AuthState {
  /** Currently authenticated user, null if not logged in */
  user: UserRead | null;
  /** JWT access token for API authentication */
  token: string | null;
  /** JWT refresh token for obtaining new access tokens */
  refreshToken: string | null;
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
}

/**
 * Utility to safe parse JSON from localStorage or sessionStorage depending on the implementation.
 */
const getStoredUser = (): UserRead | null => {
  // const storedUser = localStorage.getItem("user");
  const storedUser = sessionStorage.getItem("user");
  if (!storedUser) return null;
  try {
    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    // localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    return null;
  }
};

const initialState: AuthState = {
  user: getStoredUser(),
  // token: localStorage.getItem("token"),
  // refreshToken: localStorage.getItem("refreshToken"),
  // isAuthenticated: !!localStorage.getItem("token"),
  token: sessionStorage.getItem("token"),
  refreshToken: sessionStorage.getItem("refreshToken"),
  isAuthenticated: !!sessionStorage.getItem("token"),
};

/**
 * Authentication Redux slice.
 * Handles login, logout, and user profile updates.
 */
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Sets user credentials after successful login.
     * Updates state and persists tokens and user data to localStorage or sessionStorage depending on the implementation.
     */
    setCredentials: (
      state,
      {
        payload: { user, access_token, refresh_token },
      }: PayloadAction<{
        user: UserRead;
        access_token: string;
        refresh_token: string;
      }>,
    ) => {
      state.user = user;
      state.token = access_token;
      state.refreshToken = refresh_token;
      state.isAuthenticated = true;
      // localStorage.setItem("token", access_token);
      // localStorage.setItem("refreshToken", refresh_token);
      // localStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("token", access_token);
      sessionStorage.setItem("refreshToken", refresh_token);
      sessionStorage.setItem("user", JSON.stringify(user));
    },
    /**
     * Clears all authentication data on logout.
     * Removes tokens and user data from both state and localStorage or sessionStorage depending on the implementation.
     */
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      // localStorage.removeItem("token");
      // localStorage.removeItem("refreshToken");
      // localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
    },
    /**
     * Updates the user profile data in state and persists to localStorage or sessionStorage depending on the implementation.
     * Used when fetching or updating user information.
     */
    setUser: (state, action: PayloadAction<UserRead>) => {
      state.user = action.payload;
      // localStorage.setItem("user", JSON.stringify(action.payload));
      sessionStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
});

export const { setCredentials, logout, setUser } = authSlice.actions;

export default authSlice.reducer;

/**
 * Selector to get the currently authenticated user.
 * @param state - Redux state object
 * @returns The current user object or null if not authenticated
 */
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;

/**
 * Selector to check if the user is authenticated.
 * @param state - Redux state object
 * @returns True if user has valid token, false otherwise
 */
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
