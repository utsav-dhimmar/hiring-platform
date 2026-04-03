/**
 * Admin API related TypeScript types.
 * Based on the backend Pydantic schemas in app/v1/schemas/admin.py.
 */

import type { Job } from "@/types/job";
import type { JobStageConfig } from "@/types/stage";

/**
 * Base fields for a permission.
 */
export interface PermissionBase {
  /** Unique name of the permission */
  name: string;
  /** Detailed description of what this permission allows */
  description: string;
}

/**
 * Permission returned from read operations.
 */
export interface PermissionRead extends PermissionBase {
  /** Unique identifier (UUID) */
  id: string;
  /** ISO timestamp of when the permission was created */
  created_at?: string;
}

/**
 * Payload for creating a new permission.
 */
export interface PermissionCreate extends PermissionBase { }

/**
 * Base fields for a role.
 */
export interface RoleBase {
  /** Name of the role (e.g., "admin", "recruiter") */
  name: string;
}

/**
 * Payload for creating a new role.
 */
export interface RoleCreate extends RoleBase {
  /** List of permission IDs to associate with this role */
  permission_ids?: string[];
}

/**
 * Payload for updating an existing role.
 */
export interface RoleUpdate {
  /** Optional new name for the role */
  name?: string;
  /** Optional new list of permission IDs (replaces existing) */
  permission_ids?: string[];
}

/**
 * Role returned from read operations.
 */
export interface RoleRead extends RoleBase {
  /** Unique identifier (UUID) */
  id: string;
  /** ISO timestamp of when the role was created */
  created_at?: string;
  /** ISO timestamp of last update */
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
  /** User's email address (must be unique) */
  email: string;
  /** Optional initial password */
  password?: string;
  /** User's full name */
  full_name?: string;
  /** Whether the account is active */
  is_active?: boolean;
  /** ID of the role to assign */
  role_id: string;
}

/**
 * Payload for updating an existing user via admin.
 */
export interface UserAdminUpdate {
  /** Optional new full name */
  full_name?: string;
  /** Optional status update */
  is_active?: boolean;
  /** Optional new role assignment */
  role_id?: string;
}

/**
 * User returned from admin read operations.
 */
export interface UserAdminRead {
  /** Unique identifier (UUID) */
  id: string;
  /** User's full name */
  full_name?: string;
  /** User's email address */
  email: string;
  /** Whether the account is currently active */
  is_active: boolean;
  /** ID of the assigned role */
  role_id: string;
  /** ISO timestamp of creation */
  created_at?: string;
  /** ISO timestamp of last update */
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
  /** Unique identifier of the log entry */
  id: string;
  /** ID of the user who performed the action */
  user_id: string;
  /** Description of the action performed (e.g., "create_user") */
  action: string;
  /** Type of object affected (e.g., "user", "job") */
  target_type?: string;
  /** ID of the specific target object affected */
  target_id?: string;
  /** Additional structured data about the change */
  details?: Record<string, unknown>;
  /** ISO timestamp of the action */
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
  /** Unique identifier of the upload */
  id: string;
  /** Original name of the uploaded file */
  file_name?: string;
  /** MIME type or extension of the file */
  file_type?: string;
  /** File size in bytes */
  size?: number;
  /** Associated candidate ID if applicable */
  candidate_id?: string;
  /** Associated job ID if applicable */
  job_id?: string;
  /** Name or ID of the user who uploaded the file */
  uploaded_by: string;
  /** ISO timestamp of the upload */
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
  /** Total number of users registered in the system */
  total_users: number;
  /** Total number of defined roles */
  total_roles: number;
  /** Total number of defined permissions */
  total_permissions: number;
  /** Total number of job postings */
  total_jobs: number;
  /** Total number of candidates in the database */
  total_candidates: number;
  /** Total number of resumes uploaded */
  total_resumes: number;
  /** Number of jobs currently marked as active */
  active_jobs: number;
  /** Number of users currently marked as active */
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
  /** Total number of jobs created */
  total_jobs: number;
  /** Number of active job postings */
  active_jobs: number;
  /** Total number of unique candidates */
  total_candidates: number;
  /** Breakdown of candidate counts for each job */
  candidates_by_job: JobCandidateStats[];
  /** Number of resumes uploaded in the past 30 days */
  resumes_uploaded_last_30_days: number;
  /** Optional aggregate resume score across all candidates */
  average_resume_score?: number;

  pass_rate?: number;
  llm_parsed_count: number;
  hr_decided_count: number;
  pending_count: number;
}

/**
 * Job Management Types
 */

/**
 * Payload for creating a new job posting.
 */
export interface JobCreate {
  /** Job title (e.g., "Senior Software Engineer") */
  title: string;
  /** Department or team name */
  department?: string;
  /** Plain text job description */
  jd_text?: string;
  /** Structured JSON data for the job description */
  jd_json?: Record<string, unknown>;
  /** Whether the job is immediately active */
  is_active?: boolean;
  /** List of skill IDs required for this job */
  skill_ids?: string[];
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
  skill_ids?: string[];
}

/**
 * Skill Management Types
 */

/**
 * Base fields for a skill.
 */
export interface SkillBase {
  /** Name of the skill (e.g., "React", "Python") */
  name: string;
  /** Optional description of what this skill entails */
  description?: string;
}

/**
 * Payload for creating a new skill.
 */
export interface SkillCreate extends SkillBase { }

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

/**
 * Department Management Types
 */

/**
 * Shared fields for a department.
 */
export interface DepartmentBase {
  /** Unique name of the department */
  name: string;
  /** Optional description of the department */
  description?: string | null;
}

/**
 * Payload for creating a new department.
 */
export interface DepartmentCreate extends DepartmentBase { }

/**
 * Payload for updating an existing department.
 */
export interface DepartmentUpdate {
  name?: string;
  description?: string | null;
}

/**
 * Department returned from read operations.
 */
export interface DepartmentRead extends DepartmentBase {
  /** Unique identifier (UUID) */
  id: string;
}

/**
 * Stage Template Management Types
 */

/**
 * Payload for creating a new stage template.
 */
export interface StageTemplateCreate {
  /** Name of the interview stage (e.g., "Technical Assessment") */
  name: string;
  /** Description of what happens during this stage */
  description?: string;
  /** Default configuration parameters for this stage type */
  default_config?: Record<string, any>;
}

/**
 * Payload for updating an existing stage template.
 */
export interface StageTemplateUpdate {
  name?: string;
  description?: string;
  default_config?: Record<string, any>;
}

/**
 * Job Stage Configuration Types
 */

/**
 * Payload for adding a stage to a job.
 */
export interface JobStageConfigCreate {
  /** ID of the stage template to use */
  template_id: string;
  /** Order in which this stage appears (0-indexed) */
  stage_order: number;
  /** Job-specific configuration overrides for this stage */
  config?: Record<string, any>;
  /** Whether passing this stage is required to advance */
  is_mandatory?: boolean;
}

/**
 * Payload for updating a job-specific stage configuration.
 */
export interface JobStageConfigUpdate {
  stage_order?: number;
  config?: Record<string, any>;
  is_mandatory?: boolean;
}

/**
 * Payload for reordering stages within a job.
 */
export interface JobStageReorder {
  stage_ids: string[];
}

/**
 * Job returned from read operations.
 */
export interface JobRead extends Omit<Job, "skills"> {
  skills?: SkillRead[];
  stages?: JobStageConfig[];
}

/**
 * Detailed AI analysis of a resume.
 */
export interface CandidateMatchAnalysis {
  match_percentage: number;
  skill_gap_analysis: string;
  experience_alignment: string;
  strength_summary: string;
  missing_skills?: { name: string; score: number }[];
  extraordinary_points?: string[];
  custom_extractions?: any;
}

/**
 * Result of a candidate analysis/screening for a single candidate.
 */
export interface CandidateAnalysis {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  current_status?: string;
  resume_score?: number;
  pass_fail?: string | boolean | null;
  resume_analysis?: CandidateMatchAnalysis | null;
  resume_id?: string;
  created_at: string;
  is_parsed?: boolean;
  processing_status?: string;
  processing_error?: string | null;
  hr_decision?: "approve" | "reject" | "maybe" | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  /**
   * Candidate's location (city, country, etc.).
   * May be null/undefined if not extracted — render as "N/A".
   */
  location?: string | null;
  /**
   * Timestamp when the HR uploaded the candidate's resume.
   * Falls back to created_at when not provided — render as "N/A" if both are absent.
   */
  applied_at?: string | null;
  /**
   * The JD version number at which this candidate's resume was last analyzed.
   * Compare against job.version to determine if reanalysis is needed.
   * null/undefined means it has never been successfully analyzed.
   */
  applied_version_number?: number | null;
}

/**
 * Response containing all candidate analysis results for a job.
 */
export interface CandidateAnalysisResponse {
  data: CandidateAnalysis[];
  total: number;
}
