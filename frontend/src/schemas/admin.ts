import * as z from "zod";

/**
 * Zod validation schemas for admin user management.
 */

export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long").optional().or(z.literal("")),
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  is_active: z.boolean().default(true),
  role_id: z.string().uuid("Invalid role ID"),
});

export type UserCreateFormValues = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  is_active: z.boolean().optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
});

export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

export const permissionCreateSchema = z.object({
  name: z.string().min(3, "Permission name must be at least 3 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
});

export type PermissionCreateFormValues = z.infer<typeof permissionCreateSchema>;

export const roleCreateSchema = z.object({
  name: z.string().min(3, "Role name must be at least 3 characters long"),
  permission_ids: z.array(z.string().uuid("Invalid permission ID")).optional().default([]),
});

export type RoleCreateFormValues = z.infer<typeof roleCreateSchema>;
