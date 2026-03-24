import apiClient from "@/apis/client";
import type {
  EvaluationResult,
  TestEvaluationRequest,
  TestRawAgentResponse,
} from "@/types/evaluation";

/**
 * Service for evaluating candidate interviews and resumes.
 * Provides endpoints for running AI-powered evaluations, testing evaluation logic,
 * and retrieving raw agent output for debugging purposes.
 */
export const evaluationService = {
  /**
   * Triggers Stage 1 (HR Round) evaluation for a completed transcript.
   * The evaluation analyzes the transcript against job requirements and generates scores.
   * @param interviewId - UUID of the interview session
   * @param transcriptId - UUID of the completed transcript to evaluate
   * @returns Promise resolving to evaluation results with scores and feedback
   * @throws {Error} When interview or transcript not found, or evaluation fails
   * @example
   * ```ts
   * const result = await evaluationService.runEvaluation(interviewId, transcriptId);
   * console.log(result.scores, result.recommendation);
   * ```
   */
  runEvaluation: async (interviewId: string, transcriptId: string): Promise<EvaluationResult> => {
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
   * Tests the evaluation pipeline with a file upload without storing in database.
   * Useful for validating evaluation prompts and testing new job descriptions.
   * @param data - Test evaluation payload containing resume file and job description
   * @returns Promise resolving to evaluation results
   * @throws {Error} When file format is invalid or evaluation fails
   * @example
   * ```ts
   * const result = await evaluationService.testEvaluation({
   *   file: resumeFile,
   *   job_description: "Senior React Developer with TypeScript experience",
   *   candidate_name: "John Doe"
   * });
   * ```
   */
  testEvaluation: async (data: TestEvaluationRequest): Promise<EvaluationResult> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("job_description", data.job_description);
    if (data.candidate_name) {
      formData.append("candidate_name", data.candidate_name);
    }

    const response = await apiClient.post<EvaluationResult>("/test-evaluation", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Retrieves raw agent output for debugging evaluation pipelines.
   * Returns the unprocessed response from the AI agent before parsing.
   * @param file - Transcript file to analyze (.docx format)
   * @param jobDescription - Job requirements to evaluate against
   * @returns Promise resolving to raw agent response with debug information
   * @throws {Error} When file format is invalid or agent fails to process
   */
  testRawAgent: async (file: File, jobDescription: string): Promise<TestRawAgentResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDescription);

    const response = await apiClient.post<TestRawAgentResponse>("/test-raw-agent", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
