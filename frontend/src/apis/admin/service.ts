import apiClient from "../client";
import type {
  AnalyticsSummary,
  AuditLogRead,
  HiringReport,
  JobCreate,
  JobRead,
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
  UserAdminCreate,
  UserAdminRead,
  UserAdminUpdate,
} from "./types";
import type { CandidateResponse } from "../types/resume";
import type { JobStageConfig, StageEvaluation } from "../types/stage";

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
 * Job Management APIs
 */
export const adminJobService = {
  getAllJobs: async (skip: number = 0, limit: number = 100): Promise<JobRead[]> => {
    const response = await apiClient.get<JobRead[]>("/jobs", {
      params: { skip, limit },
    });
    return response.data;
  },

  createJob: async (job: JobCreate): Promise<JobRead> => {
    const response = await apiClient.post<JobRead>("/jobs", job);
    return response.data;
  },

  getJobById: async (jobId: string): Promise<JobRead> => {
    const response = await apiClient.get<JobRead>(`/jobs/${jobId}`);
    return response.data;
  },

  updateJob: async (jobId: string, job: JobUpdate): Promise<JobRead> => {
    const response = await apiClient.patch<JobRead>(`/jobs/${jobId}`, job);
    return response.data;
  },

  deleteJob: async (jobId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}`);
  },

  getJobStages: async (jobId: string): Promise<JobStageConfig[]> => {
    const response = await apiClient.get<JobStageConfig[]>(`/jobs/${jobId}/stages`);
    return response.data;
  },
};

/**
 * Skill Management APIs
 */
export const adminSkillService = {
  getAllSkills: async (skip: number = 0, limit: number = 100): Promise<SkillRead[]> => {
    const response = await apiClient.get<SkillRead[]>("/skills", {
      params: { skip, limit },
    });
    return response.data;
  },

  createSkill: async (skill: SkillCreate): Promise<SkillRead> => {
    const response = await apiClient.post<SkillRead>("/skills", skill);
    return response.data;
  },

  getSkillById: async (skillId: string): Promise<SkillRead> => {
    const response = await apiClient.get<SkillRead>(`/skills/${skillId}`);
    return response.data;
  },

  updateSkill: async (skillId: string, skill: SkillUpdate): Promise<SkillRead> => {
    const response = await apiClient.patch<SkillRead>(`/skills/${skillId}`, skill);
    return response.data;
  },

  deleteSkill: async (skillId: string): Promise<void> => {
    await apiClient.delete(`/skills/${skillId}`);
  },
};

/**
 * Candidate Management APIs
 */
export const adminCandidateService = {
  getCandidatesForJob: async (
    jobId: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<CandidateResponse[]> => {
    const response = await apiClient.get<CandidateResponse[]>(`/candidates/jobs/${jobId}`, {
      params: { skip, limit },
    });
    return response.data;
  },

  searchJobCandidates: async (
    jobId: string,
    query: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<CandidateResponse[]> => {
    const response = await apiClient.get<CandidateResponse[]>(`/candidates/jobs/${jobId}/search`, {
      params: { query, skip, limit },
    });
    return response.data;
  },

  searchCandidates: async (
    query: string,
    skip: number = 0,
    limit: number = 100,
  ): Promise<CandidateResponse[]> => {
    const response = await apiClient.get<CandidateResponse[]>("/candidates/search", {
      params: { query, skip, limit },
    });
    return response.data;
  },

  getCandidateEvaluations: async (candidateId: string): Promise<StageEvaluation[]> => {
    const response = await apiClient.get<StageEvaluation[]>(`/candidates/${candidateId}/evaluations`);
    return response.data;
  },
};
