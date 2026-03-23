import apiClient from "@/apis/client";
import type { CandidateResponse } from "@/types/resume";
import type { StageEvaluation } from "@/types/stage";

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
