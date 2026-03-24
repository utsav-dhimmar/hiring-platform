/**
 * Type definitions for interview management.
 */

/**
 * Possible states for an interview session.
 */
export type InterviewStatus = "pending" | "completed" | "rejected" | "cancelled";

/**
 * Interview data returned from read operations.
 */
export interface InterviewRead {
  /** Unique identifier for the interview */
  id: string;
  /** ID of the candidate being interviewed */
  candidate_id: string;
  /** ID of the job this interview is for */
  job_id: string;
  /** ID of the interviewer assigned to this interview */
  interviewer_id: string;
  /** Current status of the interview */
  status: InterviewStatus;
  /** Timestamp when the interview was created */
  created_at: string;
}

/**
 * Paginated response containing a list of interviews.
 */
export interface InterviewListResponse {
  /** Array of interview records */
  interviews: InterviewRead[];
  /** Total number of interviews matching the query */
  total: number;
}

/**
 * Payload for creating a new interview session.
 */
export interface InterviewCreate {
  /** ID of the candidate to interview */
  candidate_id: string;
  /** ID of the job the candidate applied for */
  job_id: string;
}

/**
 * Payload for updating an interview decision.
 */
export interface InterviewDecision {
  /** Decision to proceed with or reject the candidate */
  decision: "proceed" | "reject";
  /** Optional notes about the decision */
  notes?: string;
}
