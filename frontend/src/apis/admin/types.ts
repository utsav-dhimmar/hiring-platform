/**
 * Admin API related TypeScript types.
 * Based on the backend Pydantic schemas in app/v1/schemas/admin.py.
 */

export interface PermissionBase {
  name: string;
  description: string;
}

export interface PermissionRead extends PermissionBase {
  id: string;
  created_at?: string;
}

export interface PermissionCreate extends PermissionBase {}

export interface RoleBase {
  name: string;
}

export interface RoleCreate extends RoleBase {
  permission_ids?: string[];
}

export interface RoleUpdate {
  name?: string;
  permission_ids?: string[];
}

export interface RoleRead extends RoleBase {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export interface RoleWithPermissions extends RoleRead {
  permissions: PermissionRead[];
}

export interface UserAdminCreate {
  email: string;
  password?: string;
  full_name?: string;
  is_active?: boolean;
  role_id: string;
}

export interface UserAdminUpdate {
  full_name?: string;
  is_active?: boolean;
  role_id?: string;
}

export interface UserAdminRead {
  id: string;
  full_name?: string;
  email: string;
  is_active: boolean;
  role_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends UserAdminRead {
  role: RoleRead;
}

export interface AuditLogRead {
  id: string;
  user_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
  created_at?: string;
}

export interface AuditLogWithUser extends AuditLogRead {
  user: UserAdminRead;
}

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

export interface RecentUploadWithDetails extends RecentUploadRead {
  candidate_name?: string;
  job_title?: string;
  uploader_email?: string;
}

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

export interface JobCandidateStats {
  job_id: string;
  job_title: string;
  candidate_count: number;
}

export interface HiringReport {
  total_jobs: number;
  active_jobs: number;
  total_candidates: number;
  candidates_by_job: JobCandidateStats[];
  resumes_uploaded_last_30_days: number;
  average_resume_score?: number;
  pass_rate?: number;
}
