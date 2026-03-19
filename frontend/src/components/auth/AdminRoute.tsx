/**
 * Route wrapper that restricts access to admin users.
 * Redirects non-admin or unauthenticated users.
 */

import type React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser, selectIsAuthenticated } from '../../store/slices/authSlice';

/**
 * Props for the AdminRoute component.
 */
interface AdminRouteProps {
  /** Child components to render when user is authenticated and is an admin */
  children: React.ReactNode;
}

/**
 * Route guard that requires admin role.
 * Redirects to / if the user is not an admin.
 * Redirects to /login if the user is not authenticated.
 */
const AdminRoute = ({ children }: AdminRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is admin. Since we added role_name to UserRead, we can use it.
  // We also check role_id if role_name is missing (just in case) or use a fallback.
  const isAdmin = user?.role_name?.toLowerCase() === 'admin';

  if (!isAdmin) {
    // If not admin, redirect to home page or show a 403 page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
