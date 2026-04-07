export const PERMISSIONS = {
  ADMIN_ACCESS: "admin:access",
  ADMIN_ALL: "admin:all",
  ANALYTICS_READ: "analytics:read",
  AUDIT_READ: "audit:read",
  CANDIDATES_ACCESS: "candidates:access",
  CANDIDATES_DECIDE: "candidates:decide",
  DEPARTMENTS_ACCESS: "departments:access",
  DEPARTMENTS_MANAGE: "departments:manage",
  FILES_READ: "files:read",
  JOBS_ACCESS: "jobs:access",
  JOBS_MANAGE: "jobs:manage",
  PERMISSIONS_READ: "permissions:read",
  PERMISSIONS_MANAGE: "permissions:manage",
  ROLES_READ: "roles:read",
  ROLES_MANAGE: "roles:manage",
  SKILLS_ACCESS: "skills:access",
  SKILLS_MANAGE: "skills:manage",
  USERS_READ: "users:read",
  USERS_MANAGE: "users:manage",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
export type PermissionMatch = "any" | "all";

export function hasPermission(
  userPermissions: readonly string[] | null | undefined,
  permission: string,
): boolean {
  if (!permission) {
    return true;
  }

  const grantedPermissions = userPermissions ?? [];
  return (
    grantedPermissions.includes(PERMISSIONS.ADMIN_ALL) ||
    grantedPermissions.includes(permission)
  );
}

export function hasAnyPermission(
  userPermissions: readonly string[] | null | undefined,
  permissions: readonly string[],
): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.some((permission) => hasPermission(userPermissions, permission));
}

export function hasAllPermissions(
  userPermissions: readonly string[] | null | undefined,
  permissions: readonly string[],
): boolean {
  if (permissions.length === 0) {
    return true;
  }

  return permissions.every((permission) => hasPermission(userPermissions, permission));
}

export function hasPermissions(
  userPermissions: readonly string[] | null | undefined,
  permissions: string | readonly string[] | null | undefined,
  match: PermissionMatch = "any",
): boolean {
  if (!permissions) {
    return true;
  }

  const normalizedPermissions = Array.isArray(permissions) ? permissions : [permissions];
  return match === "all"
    ? hasAllPermissions(userPermissions, normalizedPermissions)
    : hasAnyPermission(userPermissions, normalizedPermissions);
}
