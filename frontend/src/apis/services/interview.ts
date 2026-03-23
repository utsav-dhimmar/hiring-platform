import apiClient from "../client";
import type {
  InterviewRead,
  InterviewListResponse,
  InterviewCreate,
  InterviewDecision,
} from "../types/interview";

/**
 * Service for Interview management.
 */
export const interviewService = {
  /**
   * Create a new interview session.
   */
  createInterview: async (data: InterviewCreate): Promise<InterviewRead> => {
    const response = await apiClient.post<InterviewRead>("/interviews", data);
    return response.data;
  },

  /**
   * Get an interview by ID.
   */
  getInterviewById: async (interviewId: string): Promise<InterviewRead> => {
    const response = await apiClient.get<InterviewRead>(
      `/interviews/${interviewId}`,
    );
    return response.data;
  },

  /**
   * List interviews for a candidate.
   */
  getInterviewsForCandidate: async (
    candidateId: string,
  ): Promise<InterviewListResponse> => {
    const response = await apiClient.get<InterviewListResponse>(
      `/interviews/candidate/${candidateId}`,
    );
    return response.data;
  },

  /**
   * List interviews for a job.
   */
  getInterviewsByJob: async (jobId: string): Promise<InterviewListResponse> => {
    const response = await apiClient.get<InterviewListResponse>(
      `/interviews/job/${jobId}`,
    );
    return response.data;
  },

  /**
   * Update interview decision.
   */
  updateDecision: async (
    interviewId: string,
    decision: InterviewDecision,
  ): Promise<InterviewRead> => {
    const response = await apiClient.patch<InterviewRead>(
      `/interviews/${interviewId}/decision`,
      decision,
    );
    return response.data;
  },
};
