/**
 * Route wrapper that restricts access to authenticated users.
 * Redirects unauthenticated users to the login page.
 */

import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectIsAuthenticated } from '../../store/slices/authSlice';

/**
 * Props for the ProtectedRoute component.
 */
interface ProtectedRouteProps {
  /** Child components to render when user is authenticated */
  children: React.ReactNode;
}

/**
 * Route guard that requires authentication.
 * Redirects to /login if the user is not authenticated.
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */
const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default ProtectedRoute;
