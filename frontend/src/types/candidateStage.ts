/**
 * Type definitions for candidate stage evaluations and decisions.
 */

/**
 * Full evaluation result for a candidate stage.
 * Matches backend EvaluationRead.
 */
export interface EvaluationRead {
  id: string;
  interview_id?: string | null;
  transcript_id?: string | null;
  candidate_stage_id: string;
  evaluation_data: Record<string, any>;
  overall_score?: number | null;
  recommendation?: string | null;
  sim_jd_resume?: number | null;
  sim_jd_transcript?: number | null;
  sim_resume_transcript?: number | null;
  evidence_block?: Record<string, any> | null;
  created_at: string;
}

/**
 * Similarity metrics response.
 */
export interface SimilarityScores {
  candidate_stage_id: string;
  similarity_scores: {
    jd_vs_resume: number | null;
    jd_vs_transcript: number | null;
    resume_vs_transcript: number | null;
  };
}

/**
 * Response from a stage decision.
 */
export interface StageDecisionResponse {
  message: string;
  candidate_status: string;
}
