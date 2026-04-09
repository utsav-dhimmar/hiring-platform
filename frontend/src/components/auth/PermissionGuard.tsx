import type { ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import type { PermissionMatch } from "@/lib/permissions";
import { hasPermissions } from "@/lib/permissions";
import PermissionDenied from "@/components/auth/PermissionDenied";

/**
 * Props for the PermissionGuard component.
 */
interface PermissionGuardProps {
  /** Child elements to render when user has required permissions */
  children: ReactNode;
  /** Single permission or array of permissions required to render children */
  permissions: string | readonly string[];
  /** Match strategy: "any" (at least one) or "all" (all required). Defaults to "any" */
  match?: PermissionMatch;
  /** Custom fallback content to display when permission check fails */
  fallback?: ReactNode;
  /** When true, renders nothing instead of fallback when permission denied. Defaults to false */
  hideWhenDenied?: boolean;
}

/**
 * A wrapper component that conditionally renders its children based on user permissions.
 * Uses the current user's permissions from Redux store to determine access.
 * @example
 * ```tsx
 * <PermissionGuard permissions="users:read">
 *   <UserList />
 * </PermissionGuard>
 * 
 * <PermissionGuard permissions={['users:read', 'users:manage']} match="any">
 *   <AdminPanel />
 * </PermissionGuard>
 * ```
 */
const PermissionGuard = ({
  children,
  permissions,
  match = "any",
  fallback,
  hideWhenDenied = false,
}: PermissionGuardProps) => {
  const user = useAppSelector(selectCurrentUser);
  const isAllowed = hasPermissions(user?.permissions, permissions, match);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (hideWhenDenied) {
    return null;
  }

  return <>{fallback ?? <PermissionDenied />}</>;
};

export default PermissionGuard;
