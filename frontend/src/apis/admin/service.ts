import apiClient from "../client";
import type {
  AnalyticsSummary,
  AuditLogRead,
  DepartmentCreate,
  DepartmentRead,
  DepartmentUpdate,
  HiringReport,
  JobCreate,
  JobRead,
  JobStageConfigCreate,
  JobStageConfigUpdate,
  JobStageReorder,
  JobUpdate,
  PermissionCreate,
  PermissionRead,
  RecentUploadRead,
  RoleCreate,
  RoleRead,
  RoleUpdate,
  RoleWithPermissions,
  SkillCreate,
  SkillRead,
  SkillUpdate,
  StageTemplateCreate,
  StageTemplateUpdate,
  UserAdminCreate,
  UserAdminRead,
  UserAdminUpdate,
} from "./types";
import type { CandidateResponse, JobResumesResponse } from "../types/resume";
import type { JobStageConfig, StageEvaluation, StageTemplate } from "../types/stage";

/**
 * Admin API service module.
 * Provides functions for interacting with admin-only endpoints.
 */

const ADMIN_PATH = "/admin";

/**
 * User Management APIs
 */
export const adminUserService = {
  /**
   * Get all users (admin only).
   */
  getAllUsers: async (skip: number = 0, limit: number = 100): Promise<UserAdminRead[]> => {
    const response = await apiClient.get<UserAdminRead[]>(`${ADMIN_PATH}/users`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create a new user (admin only).
   */
  createUser: async (user: UserAdminCreate): Promise<UserAdminRead> => {
    const response = await apiClient.post<UserAdminRead>(`${ADMIN_PATH}/users`, user);
    return response.data;
  },

  /**
   * Get a specific user by ID (admin only).
   */
  getUserById: async (userId: string): Promise<UserAdminRead> => {
    const response = await apiClient.get<UserAdminRead>(`${ADMIN_PATH}/users/${userId}`);
    return response.data;
  },

  /**
   * Update a user (admin only).
   */
  updateUser: async (userId: string, user: UserAdminUpdate): Promise<UserAdminRead> => {
    const response = await apiClient.patch<UserAdminRead>(`${ADMIN_PATH}/users/${userId}`, user);
    return response.data;
  },

  /**
   * Delete a user (admin only).
   */
  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/users/${userId}`);
  },
};

/**
 * Role Management APIs
 */
export const adminRoleService = {
  /**
   * Get all roles (admin only).
   */
  getAllRoles: async (skip: number = 0, limit: number = 100): Promise<RoleRead[]> => {
    const response = await apiClient.get<RoleRead[]>(`${ADMIN_PATH}/roles`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create a new role (admin only).
   */
  createRole: async (role: RoleCreate): Promise<RoleWithPermissions> => {
    const response = await apiClient.post<RoleWithPermissions>(`${ADMIN_PATH}/roles`, role);
    return response.data;
  },

  /**
   * Get a specific role by ID (admin only).
   */
  getRoleById: async (roleId: string): Promise<RoleWithPermissions> => {
    const response = await apiClient.get<RoleWithPermissions>(`${ADMIN_PATH}/roles/${roleId}`);
    return response.data;
  },

  /**
   * Update a role (admin only).
   */
  updateRole: async (roleId: string, role: RoleUpdate): Promise<RoleWithPermissions> => {
    const response = await apiClient.patch<RoleWithPermissions>(
      `${ADMIN_PATH}/roles/${roleId}`,
      role,
    );
    return response.data;
  },

  /**
   * Delete a role (admin only).
   */
  deleteRole: async (roleId: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/roles/${roleId}`);
  },
};

/**
 * Permission Management APIs
 */
export const adminPermissionService = {
  /**
   * Get all permissions (admin only).
   */
  getAllPermissions: async (skip: number = 0, limit: number = 100): Promise<PermissionRead[]> => {
    const response = await apiClient.get<PermissionRead[]>(`${ADMIN_PATH}/permissions`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create a new permission (admin only).
   */
  createPermission: async (permission: PermissionCreate): Promise<PermissionRead> => {
    const response = await apiClient.post<PermissionRead>(`${ADMIN_PATH}/permissions`, permission);
    return response.data;
  },

  /**
   * Delete a permission (admin only).
   */
  deletePermission: async (permissionId: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/permissions/${permissionId}`);
  },
};

/**
 * Analytics and Audit APIs
 */
export const adminAnalyticsService = {
  /**
   * Get all audit logs (admin only).
   */
  getAuditLogs: async (skip: number = 0, limit: number = 100): Promise<AuditLogRead[]> => {
    const response = await apiClient.get<AuditLogRead[]>(`${ADMIN_PATH}/audit-logs`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get recent file uploads (admin only).
   */
  getRecentUploads: async (skip: number = 0, limit: number = 50): Promise<RecentUploadRead[]> => {
    const response = await apiClient.get<RecentUploadRead[]>(`${ADMIN_PATH}/recent-uploads`, {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Get analytics summary (admin only).
   */
  getAnalytics: async (): Promise<AnalyticsSummary> => {
    const response = await apiClient.get<AnalyticsSummary>(`${ADMIN_PATH}/analytics`);
    return response.data;
  },

  /**
   * Get hiring report with detailed statistics (admin only).
   */
  getHiringReport: async (): Promise<HiringReport> => {
    const response = await apiClient.get<HiringReport>(`${ADMIN_PATH}/hiring-report`);
    return response.data;
  },
};

/**
 * Stage Template Management APIs (Admin only)
 */
export const adminStageTemplateService = {
  /**
   * Get all stage templates.
   * @returns Promise resolving to an array of stage templates
   */
  getAllTemplates: async (): Promise<StageTemplate[]> => {
    const response = await apiClient.get<StageTemplate[]>(`${ADMIN_PATH}/stage-templates`);
    return response.data;
  },

  /**
   * Create a new stage template.
   * @param template - Payload for creating a template
   * @returns Promise resolving to the created template
   */
  createTemplate: async (template: StageTemplateCreate): Promise<StageTemplate> => {
    const response = await apiClient.post<StageTemplate>(`${ADMIN_PATH}/stage-templates`, template);
    return response.data;
  },

  /**
   * Update an existing stage template.
   * @param id - Template ID
   * @param template - Payload for updating the template
   * @returns Promise resolving to the updated template
   */
  updateTemplate: async (id: string, template: StageTemplateUpdate): Promise<StageTemplate> => {
    const response = await apiClient.patch<StageTemplate>(
      `${ADMIN_PATH}/stage-templates/${id}`,
      template,
    );
    return response.data;
  },

  /**
   * Delete a stage template.
   * @param id - Template ID
   */
  deleteTemplate: async (id: string): Promise<void> => {
    await apiClient.delete(`${ADMIN_PATH}/stage-templates/${id}`);
  },
};

/**
 * Job Management APIs
 */
export const adminJobService = {
  /**
   * Get all jobs with pagination.
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to the list of jobs
   */
  getAllJobs: async (skip: number = 0, limit: number = 100): Promise<JobRead[]> => {
    const response = await apiClient.get<{ data: JobRead[]; total: number }>("/jobs", {
      params: { skip, limit },
    });
    return response.data.data;
  },

  /**
   * Search for jobs by query.
   * @param query - Search term
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to matching jobs
   */
  searchJobs: async (query: string, skip: number = 0, limit: number = 100): Promise<JobRead[]> => {
    const response = await apiClient.get<{ data: JobRead[]; total: number }>("/jobs/search", {
      params: { q: query, skip, limit },
    });
    return response.data.data;
  },

  /**
   * Create a new job posting.
   * @param job - Job creation payload
   * @returns Promise resolving to the created job
   */
  createJob: async (job: JobCreate): Promise<JobRead> => {
    const response = await apiClient.post<JobRead>("/jobs", job);
    return response.data;
  },

  /**
   * Get job details by ID.
   * @param jobId - Job ID
   * @returns Promise resolving to job details
   */
  getJobById: async (jobId: string): Promise<JobRead> => {
    const response = await apiClient.get<JobRead>(`/jobs/${jobId}`);
    return response.data;
  },

  /**
   * Update an existing job.
   * @param jobId - Job ID
   * @param job - Job update payload
   * @returns Promise resolving to updated job details
   */
  updateJob: async (jobId: string, job: JobUpdate): Promise<JobRead> => {
    const response = await apiClient.patch<JobRead>(`/jobs/${jobId}`, job);
    return response.data;
  },

  /**
   * Delete a job posting.
   * @param jobId - Job ID
   */
  deleteJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}`);
  },

  /**
   * Get all resumes submitted for a job.
   * @param jobId - Job ID
   * @returns Promise resolving to job resumes
   */
  getJobResumes: async (jobId: string): Promise<JobResumesResponse> => {
    const response = await apiClient.get<JobResumesResponse>(`/jobs/${jobId}/resumes`);
    return response.data;
  },

  /**
   * Job Stage Configuration
   */
  /**
   * Get configured stages for a specific job.
   * @param jobId - Job ID
   * @returns Promise resolving to job stage configurations
   */
  getJobStages: async (jobId: string): Promise<JobStageConfig[]> => {
    const response = await apiClient.get<JobStageConfig[]>(`/jobs/${jobId}/stages`);
    return response.data;
  },

  /**
   * Add a new stage to a job's workflow.
   * @param jobId - Job ID
   * @param stage - Stage configuration payload
   * @returns Promise resolving to the added stage configuration
   */
  addStageToJob: async (jobId: string, stage: JobStageConfigCreate): Promise<JobStageConfig> => {
    const response = await apiClient.post<JobStageConfig>(`/jobs/${jobId}/stages`, stage);
    return response.data;
  },

  /**
   * Update a specific stage configuration for a job.
   * @param jobId - Job ID
   * @param configId - Configuration ID
   * @param stage - Update payload
   * @returns Promise resolving to updated configuration
   */
  updateJobStage: async (
    jobId: string,
    configId: string,
    stage: JobStageConfigUpdate,
  ): Promise<JobStageConfig> => {
    const response = await apiClient.patch<JobStageConfig>(
      `/jobs/${jobId}/stages/${configId}`,
      stage,
    );
    return response.data;
  },

  /**
   * Remove a stage from a job's workflow.
   * @param jobId - Job ID
   * @param configId - Configuration ID
   */
  removeStageFromJob: async (jobId: string, configId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/stages/${configId}`);
  },

  /**
   * Reorder stages for a job.
   * @param jobId - Job ID
   * @param reorder - Reorder instructions
   * @returns Promise resolving to the new list of configurations
   */
  reorderJobStages: async (jobId: string, reorder: JobStageReorder): Promise<JobStageConfig[]> => {
    const response = await apiClient.put<JobStageConfig[]>(
      `/jobs/${jobId}/stages/reorder`,
      reorder,
    );
    return response.data;
  },
};

/**
 * Skill Management APIs
 */
export const adminSkillService = {
  /**
   * Get all skills with pagination.
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to skills and total count
   */
  getAllSkills: async (
    skip: number = 0,
    limit: number = 100,
  ): Promise<{ data: SkillRead[]; total: number }> => {
    const response = await apiClient.get<{ data: SkillRead[]; total: number }>("/skills", {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Create a new skill.
   * @param skill - Skill creation payload
   * @returns Promise resolving to created skill
   */
  createSkill: async (skill: SkillCreate): Promise<SkillRead> => {
    const response = await apiClient.post<SkillRead>("/skills", skill);
    return response.data;
  },

  /**
   * Get skill details by ID.
   * @param skillId - Skill ID
   * @returns Promise resolving to skill details
   */
  getSkillById: async (skillId: string): Promise<SkillRead> => {
    const response = await apiClient.get<SkillRead>(`/skills/${skillId}`);
    return response.data;
  },

  /**
   * Update an existing skill.
   * @param skillId - Skill ID
   * @param skill - Update payload
   * @returns Promise resolving to updated skill
   */
  updateSkill: async (skillId: string, skill: SkillUpdate): Promise<SkillRead> => {
    const response = await apiClient.patch<SkillRead>(`/skills/${skillId}`, skill);
    return response.data;
  },

  /**
   * Delete a skill.
   * @param skillId - Skill ID
   */
  deleteSkill: async (skillId: string): Promise<void> => {
    await apiClient.delete(`/skills/${skillId}`);
  },
};

/**
 * Candidate Management APIs
 */
export const adminCandidateService = {
  /**
   * Get all candidates for a specific job.
   * @param jobId - Job ID
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to candidates and total count
   */
  getCandidatesForJob: async (
    jobId: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<{ data: CandidateResponse[]; total: number }> => {
    const response = await apiClient.get<{ data: CandidateResponse[]; total: number }>(
      `/candidates/jobs/${jobId}`,
      {
        params: { skip, limit },
      },
    );
    return response.data;
  },

  /**
   * Search for candidates within a specific job.
   * @param jobId - Job ID
   * @param query - Search term
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to matching candidates
   */
  searchJobCandidates: async (
    jobId: string,
    query: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<{ data: CandidateResponse[]; total: number }> => {
    const response = await apiClient.get<{ data: CandidateResponse[]; total: number }>(
      `/candidates/jobs/${jobId}/search`,
      {
        params: { query, skip, limit },
      },
    );
    return response.data;
  },

  /**
   * Search for candidates across all jobs.
   * @param query - Search term
   * @param skip - Number of records to skip
   * @param limit - Maximum number of records to return
   * @returns Promise resolving to matching candidates
   */
  searchCandidates: async (
    query: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<{ data: CandidateResponse[]; total: number }> => {
    const response = await apiClient.get<{ data: CandidateResponse[]; total: number }>(
      "/candidates/search",
      {
        params: { query, skip, limit },
      },
    );
    return response.data;
  },

  /**
   * Get all evaluations for a specific candidate.
   * @param candidateId - Candidate ID
   * @returns Promise resolving to sequence of evaluations
   */
  getCandidateEvaluations: async (candidateId: string): Promise<StageEvaluation[]> => {
    const response = await apiClient.get<StageEvaluation[]>(
      `/candidates/${candidateId}/evaluations`,
    );
    return response.data;
  },

  /**
   * Get a specific stage evaluation for a candidate.
   * @param candidateId - Candidate ID
   * @param stageConfigId - Job stage configuration ID
   */
  getStageEvaluation: async (
    candidateId: string,
    stageConfigId: string,
  ): Promise<StageEvaluation> => {
    const response = await apiClient.get<StageEvaluation>(
      `/candidates/${candidateId}/evaluations/${stageConfigId}`,
    );
    return response.data;
  },
};

/**
 * Service for managing departments via the admin API.
 */
export const adminDepartmentService = {
  /**
   * Retrieves all departments with optional pagination.
   * @param skip - Number of records to skip (default: 0)
   * @param limit - Maximum number of records to return (default: 100)
   */
  getAllDepartments: async (
    skip = 0,
    limit = 100,
  ): Promise<{ data: DepartmentRead[]; total: number }> => {
    const response = await apiClient.get<{ data: DepartmentRead[]; total: number }>("/departments/", {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Retrieves a single department by its ID.
   * @param departmentId - UUID of the department to retrieve
   */
  getDepartmentById: async (departmentId: string): Promise<DepartmentRead> => {
    const response = await apiClient.get<DepartmentRead>(`/departments/${departmentId}`);
    return response.data;
  },

  /**
   * Creates a new department.
   * @param data - Department creation payload
   */
  createDepartment: async (data: DepartmentCreate): Promise<DepartmentRead> => {
    const response = await apiClient.post<DepartmentRead>("/departments/", data);
    return response.data;
  },

  /**
   * Updates an existing department.
   * @param departmentId - UUID of the department to update
   * @param data - Fields to update
   */
  updateDepartment: async (departmentId: string, data: DepartmentUpdate): Promise<DepartmentRead> => {
    const response = await apiClient.patch<DepartmentRead>(`/departments/${departmentId}`, data);
    return response.data;
  },

  /**
   * Deletes a department by its ID.
   * @param departmentId - UUID of the department to delete
   */
  deleteDepartment: async (departmentId: string): Promise<void> => {
    await apiClient.delete(`/departments/${departmentId}`);
  },
};

/**
 * Results Management APIs
 */
export const adminResultsService = {
  /**
   * Get resume screening results for a job.
   */
  getResumeScreeningResults: async (jobId: string): Promise<ResumeScreeningResultsResponse> => {
    const response = await apiClient.get<ResumeScreeningResultsResponse>(
      `/jobs/${jobId}/results/resume-screening`,
    );
    return response.data;
  },

  /**
   * Get HR round results for a job.
   */
  getHRRoundResults: async (jobId: string): Promise<HRRoundResultsResponse> => {
    const response = await apiClient.get<HRRoundResultsResponse>(
      `/jobs/${jobId}/results/hr-round`,
    );
    return response.data;
  },
};
