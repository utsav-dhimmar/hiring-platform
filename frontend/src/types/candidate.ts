/**
 * Canonical candidate shape for table usage.
 * Both ResumeScreeningResult and CandidateResponse satisfy this interface.
 */
export interface UnifiedCandidate {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  github_url?: string | null;
  current_status?: string | null;
  resume_score?: number | null;
  pass_fail?: boolean | null;
  is_parsed?: boolean;
  processing_status?: string | null;
  screening_decision?: "approve" | "reject" | "maybe" | null;
  created_at: string;
  /** Explicit apply timestamp – falls back to created_at, then "N/A" */
  applied_at?: string | null;
  /** Location extracted from resume */
  location?: string | null;
}
