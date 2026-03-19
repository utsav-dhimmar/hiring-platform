/**
 * Admin API related TypeScript types.
 * Based on the backend Pydantic schemas in app/v1/schemas/admin.py.
 */

import type { Job } from "../types/job";

/**
 * Base fields for a permission.
 */
export interface PermissionBase {
  name: string;
  description: string;
}

/**
 * Permission returned from read operations.
 */
export interface PermissionRead extends PermissionBase {
  id: string;
  created_at?: string;
}

/**
 * Payload for creating a new permission.
 */
export interface PermissionCreate extends PermissionBase {}

/**
 * Base fields for a role.
 */
export interface RoleBase {
  name: string;
}

/**
 * Payload for creating a new role.
 */
export interface RoleCreate extends RoleBase {
  permission_ids?: string[];
}

/**
 * Payload for updating an existing role.
 */
export interface RoleUpdate {
  name?: string;
  permission_ids?: string[];
}

/**
 * Role returned from read operations.
 */
export interface RoleRead extends RoleBase {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Role with its associated permissions.
 */
export interface RoleWithPermissions extends RoleRead {
  permissions: PermissionRead[];
}

/**
 * Payload for creating a new user via admin.
 */
export interface UserAdminCreate {
  email: string;
  password?: string;
  full_name?: string;
  is_active?: boolean;
  role_id: string;
}

/**
 * Payload for updating an existing user via admin.
 */
export interface UserAdminUpdate {
  full_name?: string;
  is_active?: boolean;
  role_id?: string;
}

/**
 * User returned from admin read operations.
 */
export interface UserAdminRead {
  id: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  role_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * User with their role details included.
 */
export interface UserWithRole extends UserAdminRead {
  role: RoleRead;
}

/**
 * Audit log entry for tracking admin actions.
 */
export interface AuditLogRead {
  id: string;
  user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

/**
 * Audit log entry with user details.
 */
export interface AuditLogWithUser extends AuditLogRead {
  user: UserAdminRead;
}

/**
 * Recent file upload record.
 */
export interface RecentUploadRead {
  id: string;
  file_name?: string;
  file_type?: string;
  size?: number;
  candidate_id?: string;
  job_id?: string;
  uploaded_by: string;
  created_at?: string;
}

/**
 * Recent upload with additional details.
 */
export interface RecentUploadWithDetails extends RecentUploadRead {
  candidate_name?: string;
  job_title?: string;
  uploader_email?: string;
}

/**
 * Summary of platform analytics.
 */
export interface AnalyticsSummary {
  total_users: number;
  total_roles: number;
  total_permissions: number;
  total_jobs: number;
  total_candidates: number;
  total_resumes: number;
  active_jobs: number;
  active_users: number;
}

/**
 * Candidate statistics for a specific job.
 */
export interface JobCandidateStats {
  job_id: string;
  job_title: string;
  candidate_count: number;
}

/**
 * Detailed hiring report with statistics.
 */
export interface HiringReport {
  total_jobs: number;
  active_jobs: number;
  total_candidates: number;
  candidates_by_job: JobCandidateStats[];
  resumes_uploaded_last_30_days: number;
  average_resume_score?: number;
  pass_rate?: number;
}

/**
 * Job Management Types
 */

/**
 * Payload for creating a new job posting.
 */
export interface JobCreate {
  title: string;
  department?: string;
  jd_text?: string;
  jd_json?: Record<string, unknown>;
  is_active?: boolean;
}

/**
 * Payload for updating an existing job posting.
 */
export interface JobUpdate {
  title?: string;
  department?: string;
  jd_text?: string;
  jd_json?: Record<string, unknown>;
  is_active?: boolean;
}

/**
 * Job returned from read operations.
 */
export type JobRead = Job;

/**
 * Skill Management Types
 */

/**
 * Base fields for a skill.
 */
export interface SkillBase {
  name: string;
  description?: string;
}

/**
 * Payload for creating a new skill.
 */
export interface SkillCreate extends SkillBase {}

/**
 * Payload for updating an existing skill.
 */
export interface SkillUpdate {
  name?: string;
  description?: string;
}

/**
 * Skill returned from read operations.
 */
export interface SkillRead extends SkillBase {
  id: string;
}
