/**
 * Type definitions for interview stages.
 */

/**
 * Common interview stage status.
 */
export type StageStatus = "pending" | "processing" | "completed" | "failed";

export interface StageTemplate {
  id: string;
  name: string;
  description: string | null;
  default_config: Record<string, any> | null;
}

export interface JobStageConfig {
  id: string;
  job_id: string;
  template_id: string;
  stage_order: number;
  config: Record<string, any> | null;
  is_mandatory: boolean;
  template: StageTemplate;
}

export interface StageEvaluation {
  id: string;
  candidate_id: string;
  job_stage_config_id: string;
  status: StageStatus;
  // Dynamic payload based on stage type (e.g., HRScreeningAnalysis)
  analysis: any | null; 
  decision: boolean | null;
  created_at?: string;
  completed_at?: string | null;
}

/**
 * HR Screening Round (Stage 1) evaluation results.
 */
export interface HRScreeningAnalysis {
  /** Communication skill score (0-10) */
  communication_skill: number;
  /** Confidence score (0-10) */
  confidence: number;
  /** Cultural fit score (0-10) */
  cultural_fit: number;
  /** Profile understanding score (0-10) */
  profile_understanding: number;
  /** Tech-stack alignment score (0-10) */
  tech_stack_alignment: number;
  /** Salary alignment score (0-10) */
  salary_alignment: number;
  /** Overall HR screening score (0-100) */
  overall_score: number;
  /** Summary of candidate responses */
  response_summary: string;
  /** Detailed communication evaluation */
  communication_evaluation: string;
  /** Final recommendation (e.g., "Proceed to Stage 2", "Reject") */
  recommendation: string;
}

/**
 * Legacy Stage 1 information for a candidate. Kept for backwards compatibility if needed.
 */
export interface Stage1Info {
  /** Unique identifier for the stage */
  id: string;
  /** Candidate ID */
  candidate_id: string;
  /** Job ID */
  job_id: string;
  /** Transcript file ID if uploaded */
  transcript_id: string | null;
  /** Current status of Stage 1 */
  status: StageStatus;
  /** AI-powered analysis results */
  analysis: HRScreeningAnalysis | null;
  /** HR decision (true for proceed, false for reject, null for pending) */
  hr_decision: boolean | null;
  /** Timestamp when Stage 1 was created */
  created_at: string;
  /** Timestamp when analysis was completed */
  completed_at: string | null;
}
