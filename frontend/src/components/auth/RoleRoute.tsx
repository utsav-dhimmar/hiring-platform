/**
 * Route wrapper that restricts access based on user roles.
 * Redirects non-authorized or unauthenticated users.
 */

import type React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "../../store/slices/authSlice";

/**
 * Props for the RoleRoute component.
 */
interface RoleRouteProps {
  /** Child components to render when user is authenticated and has allowed role or permission */
  children: React.ReactNode;
  /** List of allowed role names (case-insensitive). Defaults to []. */
  allowedRoles?: string[];
  /** List of required permissions. User needs at least one of these. */
  requiredPermissions?: string[];
}

/**
 * Route guard that requires specific role(s) or permission(s).
 * Redirects to / if the user does not have an allowed role or required permission.
 * Redirects to /login if the user is not authenticated.
 */
const RoleRoute = ({ children, allowedRoles = [], requiredPermissions = [] }: RoleRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has one of the required permissions.
  const userPermissions = user?.permissions || [];
  const hasRequiredPermission =
    requiredPermissions.length > 0
      ? requiredPermissions.some((perm) => userPermissions.includes(perm))
      : false;

  // Check for super-permission.
  const hasAdminAll = userPermissions.includes("admin:all");

  // Check if user has one of the allowed roles (deprecated, prefer permissions).
  const userRole = user?.role_name?.toLowerCase() || "";
  const isRoleAuthorized =
    allowedRoles.length > 0 ? allowedRoles.some((role) => role.toLowerCase() === userRole) : false;

  // Authorized if:
  // 1. Has 'admin:all' super-permission
  // 2. Has one of the specifically required permissions
  // 3. Has one of the specifically allowed roles (legacy support)
  const isAuthorized = hasAdminAll || hasRequiredPermission || isRoleAuthorized;

  if (!isAuthorized) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleRoute;
