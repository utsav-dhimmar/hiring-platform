/**
 * Route wrapper for public pages that should not be accessible to authenticated users.
 * Redirects authenticated users to the home page.
 */

import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

/**
 * Props for the PublicRoute component.
 */
interface PublicRouteProps {
  /** Child components to render when user is not authenticated */
  children: React.ReactNode;
}

/**
 * Route guard for public pages.
 * Redirects to / (home) if the user is already authenticated.
 * Used for login and registration pages.
 * @example
 * ```tsx
 * <PublicRoute>
 *   <LoginPage />
 * </PublicRoute>
 * ```
 */
const PublicRoute = ({ children }: PublicRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default PublicRoute;
