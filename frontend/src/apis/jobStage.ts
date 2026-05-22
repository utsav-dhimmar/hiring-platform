import apiClient from "@/apis/client";
import type {
  StageConfigRead,
  StageCandidateResults,
  JobStageConfig,
  StageCriterionRead,
} from "@/types/jobStage";
import type {
  StageConfigUpdate,
  JobStageConfigCreate,
  JobStageConfigUpdate,
  JobStageReorder,
  JobStageBulkCreate,
} from "@/schemas/jobStage";

/**
 * API service for job stage configuration and results.
 */
export const jobStageService = {
  // --- /job-stages endpoints ---

  /**
   * Get the current criteria configuration for a job stage.
   * @param jobStageId - UUID of the job stage.
   */
  getStageConfig: async (jobStageId: string): Promise<StageConfigRead> => {
    const response = await apiClient.get<StageConfigRead>(
      `/job-stages/${jobStageId}/config`,
    );
    return response.data;
  },

  /**
   * Save the criteria configuration for a job stage.
   * @param jobStageId - UUID of the job stage.
   * @param config - The updated configuration payload.
   */
  updateStageConfig: async (
    jobStageId: string,
    config: StageConfigUpdate,
  ): Promise<StageConfigRead> => {
    const response = await apiClient.put<StageConfigRead>(
      `/job-stages/${jobStageId}/config`,
      config,
    );
    return response.data;
  },

  /**
   * Get evaluation results for all candidates in a specific job stage.
   * @param jobStageId - UUID of the job stage.
   * @param skip - Pagination skip.
   * @param limit - Pagination limit.
   */
  getStageCandidateResults: async (
    jobStageId: string,
    skip = 0,
    limit = 100,
  ): Promise<StageCandidateResults> => {
    const response = await apiClient.get<StageCandidateResults>(
      `/job-stages/${jobStageId}/candidate-results`,
      {
        params: { skip, limit },
      },
    );
    return response.data;
  },

  // --- /jobs/{job_id}/stages endpoints ---

  /**
   * Retrieve the ordered interview stages for a job.
   */
  getJobStages: async (jobId: string): Promise<JobStageConfig[]> => {
    const response = await apiClient.get<JobStageConfig[]>(
      `/jobs/${jobId}/stages`,
    );
    return response.data;
  },

  /**
   * Add a new stage to a job's interview process.
   */
  addStageToJob: async (
    jobId: string,
    stage: JobStageConfigCreate,
  ): Promise<JobStageConfig> => {
    const response = await apiClient.post<JobStageConfig>(
      `/jobs/${jobId}/stages`,
      stage,
    );
    return response.data;
  },

  /**
   * Auto-setup the default interview pipeline for this job.
   */
  setupDefaultStages: async (jobId: string): Promise<JobStageConfig[]> => {
    const response = await apiClient.post<JobStageConfig[]>(
      `/jobs/${jobId}/stages/default`,
    );
    return response.data;
  },

  /**
   * Update a specific job stage configuration.
   */
  updateJobStage: async (
    jobId: string,
    configId: string,
    update: JobStageConfigUpdate,
  ): Promise<JobStageConfig> => {
    const response = await apiClient.patch<JobStageConfig>(
      `/jobs/${jobId}/stages/${configId}`,
      update,
    );
    return response.data;
  },

  /**
   * Remove a stage from a job's interview process.
   */
  removeStageFromJob: async (jobId: string, configId: string): Promise<void> => {
    await apiClient.delete(`/jobs/${jobId}/stages/${configId}`);
  },

  /**
   * Bulk update the order of stages for a job.
   */
  reorderJobStages: async (
    jobId: string,
    reorder: JobStageReorder,
  ): Promise<JobStageConfig[]> => {
    const response = await apiClient.put<JobStageConfig[]>(
      `/jobs/${jobId}/stages/reorder`,
      reorder,
    );
    return response.data;
  },

  /**
   * Setup/Overwrite the entire recruitment pipeline for a job in one go.
   */
  bulkSetupJobStages: async (
    jobId: string,
    bulk: JobStageBulkCreate,
  ): Promise<JobStageConfig[]> => {
    const response = await apiClient.post<JobStageConfig[]>(
      `/jobs/${jobId}/stages/bulk`,
      bulk,
    );
    return response.data;
  },

  /**
   * Retrieve the active evaluation criteria for a specific stage of a job.
   */
  getStageCriteria: async (
    jobId: string,
    stageId: string,
  ): Promise<StageCriterionRead[]> => {
    const response = await apiClient.get<StageCriterionRead[]>(
      `/jobs/${jobId}/stages/${stageId}/criteria`,
    );
    return response.data;
  },
};
