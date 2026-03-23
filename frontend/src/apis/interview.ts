import apiClient from "@/apis/client";
import type {
  InterviewRead,
  InterviewListResponse,
  InterviewCreate,
  InterviewDecision,
} from "@/types/interview";

/**
 * Service for managing interview sessions and candidate evaluations.
 * Provides endpoints for creating interviews, retrieving interview details,
 * and updating interview decisions at various stages.
 */
export const interviewService = {
  /**
   * Creates a new interview session for a candidate.
   * @param data - Interview creation payload with candidate and job details
   * @returns Promise resolving to the created interview object
   * @throws {Error} When required fields are missing or validation fails
   * @example
   * ```ts
   * const interview = await interviewService.createInterview({
   *   job_id: "job-uuid",
   *   candidate_id: "candidate-uuid"
   * });
   * ```
   */
  createInterview: async (data: InterviewCreate): Promise<InterviewRead> => {
    const response = await apiClient.post<InterviewRead>("/interviews", data);
    return response.data;
  },

  /**
   * Retrieves an interview by its unique identifier.
   * @param interviewId - UUID of the interview
   * @returns Promise resolving to interview details including current stage and status
   * @throws {Error} When interview is not found
   */
  getInterviewById: async (interviewId: string): Promise<InterviewRead> => {
    const response = await apiClient.get<InterviewRead>(`/interviews/${interviewId}`);
    return response.data;
  },

  /**
   * Retrieves all interviews associated with a specific candidate.
   * @param candidateId - UUID of the candidate
   * @returns Promise resolving to list of interviews for the candidate
   */
  getInterviewsForCandidate: async (candidateId: string): Promise<InterviewListResponse> => {
    const response = await apiClient.get<InterviewListResponse>(
      `/interviews/candidate/${candidateId}`,
    );
    return response.data;
  },

  /**
   * Retrieves all interviews for a specific job posting.
   * @param jobId - UUID of the job
   * @returns Promise resolving to list of interviews for the job
   */
  getInterviewsByJob: async (jobId: string): Promise<InterviewListResponse> => {
    const response = await apiClient.get<InterviewListResponse>(`/interviews/job/${jobId}`);
    return response.data;
  },

  /**
   * Updates the decision for an interview (e.g., move to next stage, accept, reject).
   * @param interviewId - UUID of the interview to update
   * @param decision - Decision object containing the new decision status
   * @returns Promise resolving to updated interview object
   * @throws {Error} When interview not found or decision is invalid
   * @example
   * ```ts
   * const updated = await interviewService.updateDecision(interviewId, {
   *   stage: "hr_round",
   *   decision: "passed"
   * });
   * ```
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
