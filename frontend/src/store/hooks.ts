/**
 * Typed Redux hooks for use throughout the application.
 * Provides proper TypeScript typing for dispatch and selector hooks.
 */

import { useMemo } from "react";
import { useSelector, useDispatch, type TypedUseSelectorHook } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated } from "./slices/authSlice";
import type { RootState, AppDispatch } from "./index";

/**
 * Typed dispatch hook for dispatching actions to the Redux store.
 * Use throughout the app instead of plain `useDispatch`.
 * @example
 * ```ts
 * const dispatch = useAppDispatch();
 * dispatch(setCredentials({ user, access_token, refresh_token }));
 * ```
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Typed selector hook for selecting state from the Redux store.
 * Use throughout the app instead of plain `useSelector`.
 * @example
 * ```ts
 * const user = useAppSelector(state => state.auth.user);
 * ```
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * Hook that provides authentication state from the Redux store.
 * Returns the current user and authentication status.
 * @returns Object containing user data and isAuthenticated flag
 * @example
 * ```ts
 * const { user, isAuthenticated } = useAuth();
 * if (isAuthenticated) {
 *   console.log(`Welcome, ${user?.full_name}`);
 * }
 * ```
 */
export const useAuth = () => {
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return useMemo(() => ({ user, isAuthenticated }), [user, isAuthenticated]);
};
