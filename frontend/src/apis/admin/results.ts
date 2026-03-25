import apiClient from "@/apis/client";
import type { ResumeScreeningResultsResponse } from "@/types/admin";

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
};
