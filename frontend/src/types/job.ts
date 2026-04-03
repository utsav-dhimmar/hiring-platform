import type { JobStageConfig } from "@/types/stage";

export interface JobDecisionSummary {
  job_id: string;
  total_candidates: number;
  approve_count: number;
  reject_count: number;
  maybe_count: number;
  undecided_count: number;
}

/**
 * Minimal job version metadata returned by the backend.
 */
export interface JobVersionMinimal {
  id: string;
  version_num: number;
}

export interface JobVersionDetail {
  id: string;
  job_id: string;
  version_number: number;
  title: string;
  jd_text: string | null;
  jd_json: Record<string, unknown> | null;
  custom_extraction_fields: string[] | null;
  created_at: string;
}

/**
 * Represents a job posting in the hiring platform.
 * Contains job details, description, status information, and workflow metadata.
 */
export interface Job {
  /** Unique identifier for the job */
  id: string;
  /** Job title or position name */
  title: string;
  /** UUID of the department this job belongs to */
  department_id: string | null;
  /** Resolved department name (read-only, from relationship) */
  department_name: string | null;
  /** Full department object returned from the API */
  department?: { id: string; name: string; description: string | null } | null;
  /** Job description in plain text format */
  jd_text: string | null;
  /** Job description in structured JSON format */
  jd_json: Record<string, unknown> | null;
  /** Whether the job is currently accepting applications */
  is_active: boolean;
  /** Optional custom extraction fields used during resume parsing */
  custom_extraction_fields?: string[] | null;
  /** Current active version number */
  version?: number;
  /** Total number of saved versions */
  total_versions?: number;
  /** Version history metadata */
  job_versions?: JobVersionMinimal[];
  /** Configured interview stages */
  stages?: JobStageConfig[];
  /** Backend-provided decision summary for the job */
  decision_summary?: JobDecisionSummary | null;
  /** ID of the user who created the job posting */
  created_by: string;
  /** Timestamp when the job was created */
  created_at: string;
  /** Skills linked to the job */
  skills: { id: string; name: string; description: string | null }[];
}
