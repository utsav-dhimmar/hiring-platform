import type { Job } from "./job";

/**
 * Base fields for a cross-job match result.
 */
export interface CrossJobMatchBase {
  /** UUID of the resume that was matched */
  resume_id: string;
  /** UUID of the original job applied for */
  original_job_id: string;
  /** UUID of the matched job */
  matched_job_id: string;
  /** Match percentage (0-100) */
  match_score: number;
}

/**
 * Detailed cross-job match record including job metadata.
 */
export interface CrossJobMatchRead extends CrossJobMatchBase {
  /** ISO timestamp when the match was created */
  created_at: string;
  /** Full job object for the matched position */
  matched_job?: Job | null;
}

/**
 * API response for a list of cross-job matches.
 */
export interface CrossJobMatchResponse {
  /** ID of the resume these matches are for */
  resume_id: string;
  /** Dictionary of match records keyed by matched_job_id */
  matches: Record<string, CrossJobMatchRead>;
  limit: number,
  skip: number,
  total: number
}
