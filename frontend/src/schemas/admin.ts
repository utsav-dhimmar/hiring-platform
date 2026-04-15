import * as z from "zod";

/**
 * Zod validation schemas for admin user management.
 */

/**
 * Schema for creating a new user via admin panel.
 * Validates email format, password requirements, and role assignment.
 */
/**
 * Schema for creating a new user via admin panel.
 * Validates email format, password requirements, and role assignment.
 */
export const userCreateSchema = z.object({
  /** Valid email address */
  email: z.string().email("Invalid email address"),
  /** Password with minimum 8 characters, optional for admin creation */
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .optional()
    .or(z.literal("")),
  /** User's full name */
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  /** Whether the user account is active by default */
  is_active: z.boolean().default(true),
  /** UUID of the role to assign to the user */
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
/**
 * Schema for updating an existing user via admin panel.
 * All fields are optional to allow partial updates.
 */
export const userUpdateSchema = z.object({
  /** User's full name */
  full_name: z.string().min(2, "Full name must be at least 2 characters long").optional(),
  /** Whether the user account is active */
  is_active: z.boolean().optional(),
  /** UUID of the role to assign */
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
/**
 * Schema for creating a new permission.
 * Requires permission name and description.
 */
export const permissionCreateSchema = z.object({
  /** Name of the permission (minimum 3 characters) */
  name: z.string().min(3, "Permission name must be at least 3 characters long"),
  /** Description of what the permission allows (minimum 5 characters) */
  description: z.string().min(5, "Description must be at least 5 characters long"),
});

/**
 * Type inferred from permissionCreateSchema.
 */
export type PermissionCreateFormValues = z.infer<typeof permissionCreateSchema>;

/**
 * Schema for creating a new role with optional permissions.
 */
/**
 * Schema for creating a new role with optional permissions.
 */
export const roleCreateSchema = z.object({
  /** Name of the role (minimum 3 characters) */
  name: z.string().min(3, "Role name must be at least 3 characters long"),
  /** Array of permission UUIDs to assign to the role */
  permission_ids: z.array(z.string().uuid("Invalid permission ID")).optional().default([]),
});

/**
 * Type inferred from roleCreateSchema.
 */
export type RoleCreateFormValues = z.infer<typeof roleCreateSchema>;

/**
 * Schema for creating a new skill.
 */
/**
 * Schema for creating a new skill.
 */
export const skillCreateSchema = z.object({
  /** Name of the skill (minimum 2 characters) */
  name: z.string().min(2, "Skill name must be at least 2 characters long"),
  /** Optional description of the skill */
  description: z.string().optional(),
});

/**
 * Type inferred from skillCreateSchema.
 */
export type SkillCreateFormValues = z.infer<typeof skillCreateSchema>;

/**
 * Schema for updating an existing skill.
 */
/**
 * Schema for updating an existing skill.
 */
export const skillUpdateSchema = z.object({
  /** Name of the skill */
  name: z.string().min(2, "Skill name must be at least 2 characters long").optional(),
  /** Optional description */
  description: z.string().optional(),
});

/**
 * Type inferred from skillUpdateSchema.
 */
export type SkillUpdateFormValues = z.infer<typeof skillUpdateSchema>;

/**
 * Schema for creating a new job posting.
 */
/**
 * Schema for creating a new job posting.
 */
export const jobCreateSchema = z.object({
  /** Job title (minimum 3 characters) */
  title: z.string().min(3, "Job title must be at least 3 characters long"),
  /** Number of open vacancies */
  vacancy: z.number({
    error: "Vacancy is required",
  }).int().positive().min(1, "Vacancy must be at least 1"),
  /** UUID of the department this job belongs to */
  department_id: z.string().uuid("Please select a valid department"),
  /** Job description text (minimum 20 characters) */
  jd_text: z
    .string()
    .min(20, "Job description must be at least 20 characters long"),
  /** Whether the job is active by default */
  is_active: z.boolean().default(true),
  /** Threshold score (0-100) for considering a candidate as 'passed' */
  passing_threshold: z.number().min(0).max(100).default(65),
  /** Array of skill UUIDs required for this job */
  skill_ids: z.array(z.string().uuid("Invalid skill ID")).min(1, "Please select at least one skill"),
  /** Optional custom extraction fields used during resume parsing */
  custom_extraction_fields: z.array(z.string()).optional().default([]),
});

/**
 * Type inferred from jobCreateSchema.
 */
export type JobCreateFormValues = z.infer<typeof jobCreateSchema>;

/**
 * Schema for updating an existing job posting.
 */
/**
 * Schema for updating an existing job posting.
 */
export const jobUpdateSchema = z.object({
  /** Job title */
  title: z.string().min(3, "Job title must be at least 3 characters long").optional(),
  /** Number of open vacancies */
  vacancy: z.number({
    error: "Vacancy is required",
  }).int().min(1, "Vacancy must be at least 1"),
  /** UUID of the department */
  department_id: z.string().uuid("Please select a valid department").optional(),
  /** Job description text */
  jd_text: z
    .string()
    .min(20, "Job description must be at least 20 characters long")
    .optional(),
  /** Whether the job is active */
  is_active: z.boolean().optional(),
  /** Threshold score (0-100) */
  passing_threshold: z.number().min(0).max(100).optional(),
  /** Array of skill UUIDs */
  skill_ids: z.array(z.string().uuid("Invalid skill ID")).min(1, "Please select at least one skill"),
  /** Array of custom extraction fields */
  custom_extraction_fields: z.array(z.string()).optional(),
});


/**
 * Type inferred from jobUpdateSchema.
 */
export type JobUpdateFormValues = z.infer<typeof jobUpdateSchema>;

/**
 * Schema for creating a new stage template.
 */
/**
 * Schema for creating a new stage template.
 */
export const stageTemplateCreateSchema = z.object({
  /** Name of the stage template (minimum 3 characters) */
  name: z.string().min(3, "Template name must be at least 3 characters long"),
  /** Optional description of the stage */
  description: z.string().optional(),
  /** Default configuration object for the stage */
  default_config: z.record(z.string(), z.any()).optional().default({}),
});

/**
 * Type inferred from stageTemplateCreateSchema.
 */
export type StageTemplateCreateFormValues = z.infer<typeof stageTemplateCreateSchema>;

/**
 * Schema for updating an existing stage template.
 */
/**
 * Schema for updating an existing stage template.
 */
export const stageTemplateUpdateSchema = z.object({
  /** Name of the stage template */
  name: z.string().min(3, "Template name must be at least 3 characters long").optional(),
  /** Optional description */
  description: z.string().optional(),
  /** Default configuration object */
  default_config: z.record(z.string(), z.any()).optional(),
});

/**
 * Type inferred from stageTemplateUpdateSchema.
 */
export type StageTemplateUpdateFormValues = z.infer<typeof stageTemplateUpdateSchema>;

/**
 * Schema for adding a stage configuration to a job.
 */
/**
 * Schema for adding a stage configuration to a job.
 */
export const jobStageConfigCreateSchema = z.object({
  /** UUID of the stage template to use */
  template_id: z.string().uuid("Invalid template ID"),
  /** Order of this stage in the interview process */
  stage_order: z.number().int().min(0, "Order must be a non-negative integer"),
  /** Whether passing this stage is required to proceed */
  is_mandatory: z.boolean().default(true),
  /** Stage-specific configuration */
  config: z.record(z.string(), z.any()).optional().default({}),
});

/**
 * Type inferred from jobStageConfigCreateSchema.
 */
export type JobStageConfigCreateFormValues = z.infer<typeof jobStageConfigCreateSchema>;

/**
 * Schema for updating a job stage configuration.
 */
/**
 * Schema for updating a job stage configuration.
 */
export const jobStageConfigUpdateSchema = z.object({
  /** Updated stage order */
  stage_order: z.number().int().min(0, "Order must be a non-negative integer").optional(),
  /** Whether passing this stage is required */
  is_mandatory: z.boolean().optional(),
  /** Updated stage configuration */
  config: z.record(z.string(), z.any()).optional(),
});

/**
 * Type inferred from jobStageConfigUpdateSchema.
 */
export type JobStageConfigUpdateFormValues = z.infer<typeof jobStageConfigUpdateSchema>;

/**
 * Schema for creating a new department.
 */
export const departmentCreateSchema = z.object({
  /** Name of the department (minimum 2 characters) */
  name: z.string().min(2, "Department name must be at least 2 characters long"),
  /** Optional description of the department */
  description: z.string().optional().nullable(),
});

/**
 * Type inferred from departmentCreateSchema.
 */
export type DepartmentCreateFormValues = z.infer<typeof departmentCreateSchema>;

/**
 * Schema for updating an existing department.
 */
export const departmentUpdateSchema = z.object({
  /** Name of the department */
  name: z.string().min(2, "Department name must be at least 2 characters long").optional(),
  /** Optional description */
  description: z.string().optional().nullable(),
});

/**
 * Type inferred from departmentUpdateSchema.
 */
export type DepartmentUpdateFormValues = z.infer<typeof departmentUpdateSchema>;
