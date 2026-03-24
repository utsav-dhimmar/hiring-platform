/**
 * Type definitions for interview stages.
 */

/**
 * Common interview stage status.
 */
export type StageStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Interview stage template definition.
 * Represents a reusable stage type that can be configured per job.
 */
export interface StageTemplate {
  /** Unique identifier for the stage template */
  id: string;
  /** Name of the stage type (e.g., "HR Screening", "Technical Interview") */
  name: string;
  /** Optional description of the stage */
  description: string | null;
  /** Default configuration for this stage type */
  default_config: Record<string, any> | null;
}

/**
 * Job-specific stage configuration.
 * Associates a stage template with a job and defines order and requirements.
 */
export interface JobStageConfig {
  /** Unique identifier for this stage configuration */
  id: string;
  /** ID of the job this stage belongs to */
  job_id: string;
  /** ID of the stage template used */
  template_id: string;
  /** Order of this stage in the interview process (0-indexed) */
  stage_order: number;
  /** Job-specific configuration overrides */
  config: Record<string, any> | null;
  /** Whether passing this stage is required to proceed */
  is_mandatory: boolean;
  /** The stage template details */
  template: StageTemplate;
}

/**
 * Evaluation record for a candidate at a specific interview stage.
 */
export interface StageEvaluation {
  /** Unique identifier for this evaluation */
  id: string;
  /** ID of the candidate being evaluated */
  candidate_id: string;
  /** ID of the job stage configuration */
  job_stage_config_id: string;
  /** Current status of the evaluation */
  status: StageStatus;
  /** Dynamic payload based on stage type (e.g., HRScreeningAnalysis) */
  analysis: any | null;
  /** Pass/fail decision from the evaluation */
  decision: boolean | null;
  /** Timestamp when the evaluation was created */
  created_at?: string;
  /** Timestamp when the evaluation was completed */
  completed_at?: string | null;
}

/**
 * HR Screening Round (Stage 1) evaluation results.
 */
export interface HRScreeningAnalysis {
  scores: {
    communication_skill: number;
    confidence: number;
    cultural_fit: number;
    profile_understanding: number;
    tech_stack_alignment: number;
    salary_alignment: number;
    overall_score: number;
  };
  criteria_detail: Record<
    string,
    {
      score: number;
      justification: string;
      evidence: string[];
    }
  >;
  red_flags: string[];
  stage_score: number;
  recommendation: string;
  recommendation_reason: string;
  strength_summary: string;
  weakness_summary: string;
  overall_summary: string;
  suggested_followups: string[];
  filler_count: number;

  // Keep legacy fields for a bit to prevent crashes while migrating components
  communication_skill?: number;
  confidence?: number;
  cultural_fit?: number;
  profile_understanding?: number;
  tech_stack_alignment?: number;
  salary_alignment?: number;
  overall_score?: number;
  response_summary?: string;
  communication_evaluation?: string;
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
