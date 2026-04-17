import * as z from "zod";

/**
 * Zod validation schemas for admin user management.
 */

// --- Shared Primitives ---

/** Factory for name strings with configurable minimum length and error message */
const nameSchema = (min: number, entity: string) =>
  z.string().trim().min(min, `${entity} must be at least ${min} characters long`);

/** Factory for optional descriptions */
const descriptionSchema = (min: number = 5) =>
  z.string().trim().min(min, `Description must be at least ${min} characters long`);

/** UUID validation with custom error */
const uuidSchema = (message: string = "Invalid UUID") => z.uuid({
  version: "v7",
  error: message,
});

/** Base email validation */
const emailSchema = z.string().email("Invalid email address").trim();

// --- User Schemas ---

/**
 * Base fields for user management.
 */
const userBaseSchema = z.object({
  /** User's full name */
  full_name: nameSchema(2, "Full name"),
  /** Whether the user account is active */
  is_active: z.boolean(),
  /** UUID of the role to assign */
  role_id: uuidSchema("Invalid role ID"),
});

/**
 * Schema for creating a new user via admin panel.
 * Validates email format, password requirements, and role assignment.
 */
export const userCreateSchema = userBaseSchema.extend({
  /** Valid email address */
  email: emailSchema,
  /** Password with minimum 8 characters, optional for admin creation */
  password: z
    .string().trim()
    .min(8, "Password must be at least 8 characters long")
    .optional()
    .or(z.literal("")),
}).partial({
  full_name: true,
}).extend({
  is_active: z.boolean().default(true),
});

/** Type inferred from userCreateSchema. */
export type UserCreateFormValues = z.infer<typeof userCreateSchema>;

/**
 * Schema for updating an existing user via admin panel.
 * All fields are optional to allow partial updates.
 */
export const userUpdateSchema = userBaseSchema.partial();

/** Type inferred from userUpdateSchema. */
export type UserUpdateFormValues = z.infer<typeof userUpdateSchema>;

// --- Permission Schemas ---

/**
 * Schema for creating a new permission.
 * Requires permission name and description.
 */
export const permissionCreateSchema = z.object({
  /** Name of the permission (minimum 3 characters) */
  name: nameSchema(3, "Permission name"),
  /** Description of what the permission allows (minimum 5 characters) */
  description: descriptionSchema(),
});

/** Type inferred from permissionCreateSchema. */
export type PermissionCreateFormValues = z.infer<typeof permissionCreateSchema>;

// --- Role Schemas ---

/**
 * Schema for creating a new role with optional permissions.
 */
export const roleCreateSchema = z.object({
  /** Name of the role (minimum 3 characters) */
  name: nameSchema(3, "Role name"),
  /** Array of permission UUIDs to assign to the role */
  permission_ids: z.array(uuidSchema("Invalid permission ID")).optional().default([]),
});

/** Type inferred from roleCreateSchema. */
export type RoleCreateFormValues = z.infer<typeof roleCreateSchema>;

// --- Skill Schemas ---

const skillBaseSchema = z.object({
  /** Name of the skill (minimum 2 characters) */
  name: nameSchema(2, "Skill name"),
  /** Optional description of the skill */
  description: z.string().trim().optional(),
});

/**
 * Schema for creating a new skill.
 */
export const skillCreateSchema = skillBaseSchema;

/** Type inferred from skillCreateSchema. */
export type SkillCreateFormValues = z.infer<typeof skillCreateSchema>;

/**
 * Schema for updating an existing skill.
 */
export const skillUpdateSchema = skillBaseSchema.partial();

/** Type inferred from skillUpdateSchema. */
export type SkillUpdateFormValues = z.infer<typeof skillUpdateSchema>;

// --- Job Schemas ---

const jobBaseSchema = z.object({
  /** Job title (minimum 3 characters) */
  title: nameSchema(3, "Job title"),
  /** Number of open vacancies */
  vacancy: z.number({
    error: "Vacancy is required",
  }).int().positive().min(1, "Vacancy must be at least 1"),
  /** UUID of the department this job belongs to */
  department_id: uuidSchema("Please select a valid department"),
  /** Job description text (minimum 20 characters) */
  jd_text: z.string().trim().min(20, "Job description must be at least 20 characters long"),
  /** Whether the job is active */
  is_active: z.boolean(),
  /** Threshold score (0-100) for considering a candidate as 'pass' */
  passing_threshold: z.number().min(0).max(100),
  /** Array of skill UUIDs required for this job */
  skill_ids: z.array(uuidSchema("Invalid skill ID")).min(1, "Please select at least one skill"),
  /** Optional custom extraction fields used during resume parsing */
  custom_extraction_fields: z.array(z.string()).optional(),
});

/**
 * Schema for creating a new job posting.
 */
export const jobCreateSchema = jobBaseSchema.extend({
  is_active: z.boolean().default(true),
  passing_threshold: z.number().min(0).max(100).default(65),
  custom_extraction_fields: z.array(z.string().trim()).optional().default([]),
});

/** Type inferred from jobCreateSchema. */
export type JobCreateFormValues = z.infer<typeof jobCreateSchema>;

/**
 * Schema for updating an existing job posting.
 */
export const jobUpdateSchema = jobBaseSchema.partial().extend({
  // Vacancy is still required to be a number if provided, but optional in the set
  vacancy: z.number({ error: "Vacancy is required" }).int().min(1, "Vacancy must be at least 1").optional(),
  // skill_ids is still required to have at least 1 if provided
  skill_ids: z.array(uuidSchema("Invalid skill ID")).min(1, "Please select at least one skill").optional(),
});

/** Type inferred from jobUpdateSchema. */
export type JobUpdateFormValues = z.infer<typeof jobUpdateSchema>;

// --- Stage Template Schemas ---

const stageTemplateBaseSchema = z.object({
  /** Name of the stage template (minimum 3 characters) */
  name: nameSchema(3, "Template name"),
  /** Optional description of the stage */
  description: z.string().trim().optional().nullable(),
  /** Default configuration object for the stage */
  default_config: z.record(z.string().trim(), z.any()),
});

/**
 * Schema for creating a new stage template.
 */
export const stageTemplateCreateSchema = stageTemplateBaseSchema.extend({
  default_config: z.record(z.string(), z.any()).optional().default({}),
});

/** Type inferred from stageTemplateCreateSchema. */
export type StageTemplateCreateFormValues = z.infer<typeof stageTemplateCreateSchema>;

/**
 * Schema for updating an existing stage template.
 */
export const stageTemplateUpdateSchema = stageTemplateBaseSchema.partial();

/** Type inferred from stageTemplateUpdateSchema. */
export type StageTemplateUpdateFormValues = z.infer<typeof stageTemplateUpdateSchema>;

// --- Job Stage Config Schemas ---

const jobStageConfigBaseSchema = z.object({
  /** UUID of the stage template to use */
  template_id: uuidSchema("Invalid template ID"),
  /** Order of this stage in the interview process */
  stage_order: z.number().int().min(0, "Order must be a non-negative integer"),
  /** Whether passing this stage is required to proceed */
  is_mandatory: z.boolean(),
  /** Stage-specific configuration */
  config: z.record(z.string().trim(), z.any()),
});

/**
 * Schema for adding a stage configuration to a job.
 */
export const jobStageConfigCreateSchema = jobStageConfigBaseSchema.extend({
  is_mandatory: z.boolean().default(true),
  config: z.record(z.string().trim(), z.any()).optional().default({}),
});

/** Type inferred from jobStageConfigCreateSchema. */
export type JobStageConfigCreateFormValues = z.infer<typeof jobStageConfigCreateSchema>;

/**
 * Schema for updating a job stage configuration.
 */
export const jobStageConfigUpdateSchema = jobStageConfigBaseSchema.omit({ template_id: true }).partial();

/** Type inferred from jobStageConfigUpdateSchema. */
export type JobStageConfigUpdateFormValues = z.infer<typeof jobStageConfigUpdateSchema>;

// --- Department Schemas ---

const departmentBaseSchema = z.object({
  /** Name of the department (minimum 2 characters) */
  name: nameSchema(2, "Department name"),
  /** Optional description of the department */
  description: z.string().trim().optional().nullable(),
});

/**
 * Schema for creating a new department.
 */
export const departmentCreateSchema = departmentBaseSchema;

/** Type inferred from departmentCreateSchema. */
export type DepartmentCreateFormValues = z.infer<typeof departmentCreateSchema>;

/**
 * Schema for updating an existing department.
 */
export const departmentUpdateSchema = departmentBaseSchema.partial();

/** Type inferred from departmentUpdateSchema. */
export type DepartmentUpdateFormValues = z.infer<typeof departmentUpdateSchema>;
