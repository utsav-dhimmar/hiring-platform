/**
 * Represents a job posting in the hiring platform.
 * Contains job details, description, and status information.
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
  /** ID of the user who created the job posting */
  created_by: string;
  /** Timestamp when the job was created */
  created_at: string;
}
