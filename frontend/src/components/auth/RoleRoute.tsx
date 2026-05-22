import type React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser, selectIsAuthenticated } from "@/store/slices/authSlice";
import type { PermissionMatch } from "@/lib/permissions";
import { hasPermissions } from "@/lib/permissions";
import PermissionDenied from "@/components/auth/PermissionDenied";

/**
 * Props for the RoleRoute component.
 */
interface RoleRouteProps {
  /** Child components to render when user is authenticated and authorized */
  children: React.ReactNode;
  /** Required permission or permission list */
  requiredPermissions?: string | readonly string[];
  /** Permission match strategy */
  match?: PermissionMatch;
  /** Optional denial fallback */
  fallback?: React.ReactNode;
}

/**
 * Route guard that requires specific permission(s).
 * Redirects to /login if the user is not authenticated.
 */
const RoleRoute = ({
  children,
  requiredPermissions,
  match = "any",
  fallback,
}: RoleRouteProps) => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAuthorized = hasPermissions(user?.permissions, requiredPermissions, match);

  if (!isAuthorized) {
    return <>{fallback ?? <PermissionDenied />}</>;
  }

  return <>{children}</>;
};

export default RoleRoute;
