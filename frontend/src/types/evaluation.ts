/**
 * Type definitions for candidate evaluation results.
 */

/**
 * Detailed scoring information for a single evaluation criterion.
 */
export interface CriterionDetail {
  /** Score for this criterion (0-100) */
  score: number;
  /** Human-readable justification for the score */
  justification: string;
  /** Evidence from the transcript supporting this score */
  evidence: string[];
}

/**
 * Evaluation scores across multiple criteria.
 */
export interface EvaluationScores {
  /** Score for communication skills (0-100) */
  communication_skill: number;
  /** Score for confidence level (0-100) */
  confidence: number;
  /** Score for cultural fit with the company (0-100) */
  cultural_fit: number;
  /** Score for understanding of the role/profile (0-100) */
  profile_understanding: number;
  /** Score for technical stack alignment (0-100) */
  tech_stack_alignment: number;
  /** Score for salary expectations alignment (0-100) */
  salary_alignment: number;
  /** Overall weighted score across all criteria (0-100) */
  overall_score: number;
}

/**
 * Possible recommendations from the evaluation.
 */
export type Recommendation = "PROCEED" | "REJECT" | "MAYBE";

/**
 * Complete evaluation result for a candidate interview.
 */
export interface EvaluationResult {
  /** Individual scores for each evaluation criterion */
  scores: EvaluationScores;
  /** Detailed breakdown of each criterion with justifications */
  criteria_detail: {
    "Communication Skill": CriterionDetail;
    Confidence: CriterionDetail;
    "Cultural Fit": CriterionDetail;
    "Profile Understanding": CriterionDetail;
    "Tech Stack Alignment": CriterionDetail;
  };
  /** Potential concerns or red flags identified */
  red_flags: string[];
  /** Overall weighted score for this stage */
  stage_score: number;
  /** Recommendation based on the evaluation */
  recommendation: Recommendation;
  /** Reason for the recommendation */
  recommendation_reason: string;
  /** Summary of candidate strengths */
  strength_summary: string;
  /** Summary of candidate weaknesses or areas for improvement */
  weakness_summary: string;
  /** Overall summary of the evaluation */
  overall_summary: string;
  /** Suggested follow-up questions for next interview stage */
  suggested_followups: string[];
  /** Count of filler words detected in the transcript */
  filler_count: number;
}

/**
 * Request payload for testing evaluation without database storage.
 */
export interface TestEvaluationRequest {
  /** Resume or transcript file to evaluate */
  file: File;
  /** Job description to evaluate against */
  job_description: string;
  /** Optional candidate name for display purposes */
  candidate_name?: string;
}

/**
 * Raw response from the AI agent before parsing.
 * Useful for debugging evaluation pipelines.
 */
export interface TestRawAgentResponse {
  /** Total length of the processed text */
  full_text_length: number;
  /** Length of the candidate's responses only */
  candidate_text_length: number;
  /** Number of filler words detected */
  filler_count: number;
  /** Number of message exchanges in the transcript */
  message_count: number;
  /** Array of message objects from the transcript */
  messages: {
    /** Role of the speaker (e.g., "interviewer", "candidate") */
    role: string;
    /** Content of the message */
    content: string;
  }[];
}
