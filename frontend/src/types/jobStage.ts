/**
 * Type definitions for job stage configuration and results.
 */

/**
 * Stage Template definition.
 * Matches backend StageTemplateRead.
 */
export interface StageTemplate {
  id: string;
  name: string;
  description: string | null;
  default_config: Record<string, any> | null;
  created_at: string;
}

/**
 * Job Stage Configuration definition.
 * Matches backend JobStageConfigRead.
 */
export interface JobStageConfig {
  id: string;
  job_id: string;
  template_id: string;
  stage_order: number;
  config: Record<string, any> | null;
  is_mandatory: boolean;
  template: StageTemplate;
  created_at: string;
}

/**
 * Criterion with its weight for a specific job stage.
 * Matches backend StageCriterionRead.
 */
export interface StageCriterionRead {
  id: string;
  name: string;
  description: string | null;
  prompt_text: string | null;
  weight: number;
  is_active: boolean;
}

/**
 * Full job stage config response.
 * Matches backend StageConfigRead.
 */
export interface StageConfigRead {
  job_stage_id: string;
  template_id: string;
  active_criteria: StageCriterionRead[];
  system_prompt_override?: string | null;
}

/**
 * A single candidate result in a stage.
 */
export interface CandidateStageResult {
  candidate_id: string;
  candidate_name: string;
  candidate_stage_id: string;
  evaluation_id: string | null;
  overall_score: number | null;
  recommendation: string | null;
  evaluation_data: any | null;
  status: string;
  created_at: string;
}

/**
 * List of candidate results for a stage.
 */
export interface StageCandidateResults {
  job_stage_id: string;
  total: number;
  results: CandidateStageResult[];
}
