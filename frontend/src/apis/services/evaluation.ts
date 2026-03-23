import apiClient from "../client";
import type {
  EvaluationResult,
  TestEvaluationRequest,
  TestRawAgentResponse,
} from "../types/evaluation";

/**
 * Service for Stage 1 evaluation endpoints.
 */
export const evaluationService = {
  /**
   * Triggers the Stage 1 evaluation for a completed transcript.
   * @param interviewId - The UUID of the interview.
   * @param transcriptId - The UUID of the completed transcript.
   */
  runEvaluation: async (
    interviewId: string,
    transcriptId: string,
  ): Promise<EvaluationResult> => {
    const response = await apiClient.post<EvaluationResult>(
      `/interviews/${interviewId}/evaluate`,
      null,
      {
        params: { transcript_id: transcriptId },
      },
    );
    return response.data;
  },

  /**
   * Tests evaluation with a file upload, bypasses database.
   * @param data - The file and metadata for testing.
   */
  testEvaluation: async (
    data: TestEvaluationRequest,
  ): Promise<EvaluationResult> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("job_description", data.job_description);
    if (data.candidate_name) {
      formData.append("candidate_name", data.candidate_name);
    }

    const response = await apiClient.post<EvaluationResult>(
      "/test-evaluation",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  /**
   * Debug endpoint to see raw agent output.
   * @param file - The transcript file.
   * @param jobDescription - The job description.
   */
  testRawAgent: async (
    file: File,
    jobDescription: string,
  ): Promise<TestRawAgentResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    const response = await apiClient.post<TestRawAgentResponse>(
      "/test-raw-agent",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
