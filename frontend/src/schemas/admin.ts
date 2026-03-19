import * as z from "zod";

/**
 * Zod validation schemas for admin user management.
 */

/**
 * Schema for creating a new user via admin panel.
 * Validates email format, password requirements, and role assignment.
 */
export const userCreateSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .optional()
    .or(z.literal("")),
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  is_active: z.boolean().default(true),
  role_id: z.string().uuid("Invalid role ID"),
});

/**
 * Type inferred from userCreateSchema.
 */
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;

/**
 * Schema for updating an existing user via admin panel.
 * All fields are optional to allow partial updates.
 */
export const userUpdateSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  is_active: z.boolean().optional(),
  role_id: z.string().uuid("Invalid role ID").optional(),
});

/**
 * Type inferred from userUpdateSchema.
 */
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

/**
 * Schema for creating a new permission.
 * Requires permission name and description.
 */
export const permissionCreateSchema = z.object({
  name: z.string().min(3, "Permission name must be at least 3 characters long"),
  description: z.string().min(5, "Description must be at least 5 characters long"),
});

/**
 * Type inferred from permissionCreateSchema.
 */
export type PermissionCreateFormValues = z.infer<typeof permissionCreateSchema>;

/**
 * Schema for creating a new role with optional permissions.
 */
export const roleCreateSchema = z.object({
  name: z.string().min(3, "Role name must be at least 3 characters long"),
  permission_ids: z.array(z.string().uuid("Invalid permission ID")).optional().default([]),
});

/**
 * Type inferred from roleCreateSchema.
 */
export type RoleCreateFormValues = z.infer<typeof roleCreateSchema>;

/**
 * Schema for creating a new skill.
 */
export const skillCreateSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters long"),
  description: z.string().optional(),
});

/**
 * Type inferred from skillCreateSchema.
 */
export type SkillCreateFormValues = z.infer<typeof skillCreateSchema>;

/**
 * Schema for updating an existing skill.
 */
export const skillUpdateSchema = z.object({
  name: z.string().min(2, "Skill name must be at least 2 characters long").optional(),
  description: z.string().optional(),
});

/**
 * Type inferred from skillUpdateSchema.
 */
export type SkillUpdateFormValues = z.infer<typeof skillUpdateSchema>;

/**
 * Schema for creating a new job posting.
 */
export const jobCreateSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters long"),
  department: z
    .string()
    .min(2, "Department must be at least 2 characters long")
    .optional()
    .or(z.literal("")),
  jd_text: z
    .string()
    .min(20, "Job description must be at least 20 characters long")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().default(true),
  skill_ids: z.array(z.string().uuid("Invalid skill ID")).default([]),
});

/**
 * Type inferred from jobCreateSchema.
 */
export type JobCreateFormValues = z.infer<typeof jobCreateSchema>;

/**
 * Schema for updating an existing job posting.
 */
export const jobUpdateSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters long").optional(),
  department: z
    .string()
    .min(2, "Department must be at least 2 characters long")
    .optional()
    .or(z.literal("")),
  jd_text: z
    .string()
    .min(20, "Job description must be at least 20 characters long")
    .optional()
    .or(z.literal("")),
  is_active: z.boolean().optional(),
  skill_ids: z.array(z.string().uuid("Invalid skill ID")).optional().default([]),
});

/**
 * Type inferred from jobUpdateSchema.
 */
export type JobUpdateFormValues = z.infer<typeof jobUpdateSchema>;
