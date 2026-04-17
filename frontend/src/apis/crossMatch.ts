import client from "@/apis/client";
import type { CrossJobMatchResponse } from "@/types/crossMatch";

/**
 * API service for Cross-Job Match operations.
 */
export const crossMatchApi = {
  /**
   * Triggers the background matching process for a resume against all other active jobs.
   * @param resumeId - The UUID of the resume to match
   * @returns Promise resolving to a 202 Accepted acknowledgement
   */
  triggerCrossMatch: async (resumeId: string): Promise<{ message: string; resume_id: string }> => {
    const response = await client.post<{ message: string; resume_id: string }>(
      `/cross-match/${resumeId}/trigger`,
    );
    return response.data;
  },

  /**
   * Retrieves the list of existing cross-job matches for a resume.
   * @param resumeId - The UUID of the resume
   * @returns Promise resolving to the match results
   */
  getCrossMatches: async (resumeId: string): Promise<CrossJobMatchResponse> => {
    const response = await client.get<CrossJobMatchResponse>(`/cross-match/${resumeId}`);
    return response.data;
  },
};
