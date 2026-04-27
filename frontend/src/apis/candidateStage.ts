import apiClient from "@/apis/client";
import type {
  EvaluationRead,
  SimilarityScores,
  StageDecisionResponse,
} from "@/types/candidateStage";
import type {
  StageOverrideCreate,
  StageDecisionCreate,
} from "@/schemas/candidateStage";

/**
 * API service for candidate stage evaluation and decision operations.
 */
export const candidateStageService = {
  /**
   * Retrieve the full evaluation result for a specific candidate stage.
   * @param id - UUID of the candidate stage.
   */
  getEvaluation: async (id: string): Promise<EvaluationRead> => {
    const response = await apiClient.get<EvaluationRead>(
      `/candidate-stages/${id}/evaluation`,
    );
    return response.data;
  },

  /**
   * Get similarity metrics (JD vs Resume, JD vs Transcript, Resume vs Transcript).
   * @param id - UUID of the candidate stage.
   */
  getSimilarityScores: async (id: string): Promise<SimilarityScores> => {
    const response = await apiClient.get<SimilarityScores>(
      `/candidate-stages/${id}/similarity-scores`,
    );
    return response.data;
  },

  /**
   * Override AI evaluation recommendation and/or criterion scores.
   * @param id - UUID of the candidate stage.
   * @param override - Override payload with reason and scores.
   */
  overrideEvaluation: async (
    id: string,
    override: StageOverrideCreate,
  ): Promise<{ message: string; evaluation_id: string }> => {
    const response = await apiClient.post<{
      message: string;
      evaluation_id: string;
    }>(`/candidate-stages/${id}/override`, override);
    return response.data;
  },

  /**
   * Record the final HR decision for this candidate stage.
   * @param id - UUID of the candidate stage.
   * @param decision - Decision payload (Approve, Reject, May Be).
   */
  recordDecision: async (
    id: string,
    decision: StageDecisionCreate,
  ): Promise<StageDecisionResponse> => {
    const response = await apiClient.post<StageDecisionResponse>(
      `/candidate-stages/${id}/decision`,
      decision,
    );
    return response.data;
  },
};
