import type { ReactNode } from "react";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import type { PermissionMatch } from "@/lib/permissions";
import { hasPermissions } from "@/lib/permissions";
import PermissionDenied from "@/components/auth/PermissionDenied";

interface PermissionGuardProps {
  children: ReactNode;
  permissions: string | readonly string[];
  match?: PermissionMatch;
  fallback?: ReactNode;
  hideWhenDenied?: boolean;
}

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
