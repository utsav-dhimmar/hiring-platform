/**
 * Type definitions for resume and candidate related API responses.
 */

import type { Job } from "./job";

/**
 * Processing status information for a resume.
 * Tracks the current state of resume parsing and analysis.
 */
export interface ResumeProcessingInfo {
  /** Current processing status (e.g., "queued", "processing", "completed", "failed") */
  status: string;
  /** Error message if processing failed */
  error: string | null;
}

/**
 * Analysis results from matching a resume against a job.
 * Contains scoring, skill gaps, and candidate evaluation details.
 */
export interface ResumeMatchAnalysis {
  /** Match percentage score (0-100) */
  match_percentage: number;
  /** Analysis of skills missing for the job */
  skill_gap_analysis: string;
  /** Assessment of how candidate's experience aligns with job requirements */
  experience_alignment: string;
  /** Summary of candidate's strengths relative to the job */
  strength_summary: string;
  /** A single missing skill and its impact on the match score */
  missing_skills: MissingSkill[];
  /** Notable qualifications beyond job requirements */
  extraordinary_points: string[];
}

/**
 * A missing skill item returned by resume analysis.
 * Includes the skill name and its importance score.
 */
export interface MissingSkill {
  /** Missing skill name */
  name: string;
  /** Importance score for the missing skill */
  score: number;
}

/**
 * Response from uploading a resume.
 * Includes initial processing status and file information.
 */
export interface ResumeUploadResponse {
  /** Success message */
  message: string;
  /** ID of the job the resume was uploaded for */
  job_id: string;
  /** ID of the candidate associated with the resume */
  candidate_id: string;
  /** ID of the uploaded file */
  file_id: string;
  /** Unique identifier for the resume record */
  resume_id: string;
  /** Name of the uploaded file */
  file_name: string;
  /** MIME type of the uploaded file */
  file_type: string;
  /** Size of the file in bytes */
  size: number;
  /** URL to access the uploaded file */
  source_url: string;
  /** Whether the resume was successfully parsed */
  parsed: boolean;
  /** Current processing status */
  processing: ResumeProcessingInfo;
  /** Resume analysis results, null if not yet completed */
  analysis: ResumeMatchAnalysis | null;
}

/**
 * Response containing the current status of a resume.
 * Used for polling resume processing status.
 */
export interface ResumeStatusResponse {
  /** ID of the job the resume belongs to */
  job_id: string;
  /** ID of the candidate */
  candidate_id: string;
  /** ID of the uploaded file */
  file_id: string;
  /** Unique identifier for the resume record */
  resume_id: string;
  /** Name of the uploaded file */
  file_name: string;
  /** MIME type of the uploaded file */
  file_type: string;
  /** Size of the file in bytes */
  size: number;
  /** URL to access the uploaded file */
  source_url: string;
  /** Whether the resume was successfully parsed */
  parsed: boolean;
  /** Current processing status */
  processing: ResumeProcessingInfo;
  /** Resume analysis results */
  analysis: ResumeMatchAnalysis | null;
}

/**
 * Candidate information extracted from a resume.
 * Includes contact details and screening results.
 */
export interface CandidateResponse {
  /** Unique identifier for the candidate */
  id: string;
  /** Candidate's first name */
  first_name: string | null;
  /** Candidate's last name */
  last_name: string | null;
  /** Candidate's email address */
  email: string | null;
  /** Candidate's phone number */
  phone: string | null;
  /** Current screening status */
  current_status: string | null;
  /** Timestamp when the candidate was added */
  created_at: string;
  /** Resume analysis results if available */
  resume_analysis: ResumeMatchAnalysis | null;
  /** Computed resume score (0-100) */
  resume_score: number | null;
  /** Pass/fail decision from screening */
  pass_fail: boolean | null;
  /** Whether the resume was successfully parsed */
  is_parsed: boolean;
  /** Current processing status */
  processing_status: string | null;
}

/**
 * Resume information for a specific job application.
 * Links a candidate's resume to a job with processing status.
 */
export interface JobResumeInfoResponse {
  /** ID of the job */
  job_id: string;
  /** ID of the candidate */
  candidate_id: string;
  /** Candidate's first name */
  candidate_first_name: string | null;
  /** Candidate's last name */
  candidate_last_name: string | null;
  /** Candidate's email address */
  candidate_email: string | null;
  /** ID of the uploaded file */
  file_id: string;
  /** Unique identifier for the resume record */
  resume_id: string;
  /** Name of the uploaded file */
  file_name: string;
  /** MIME type of the uploaded file */
  file_type: string;
  /** Size of the file in bytes */
  size: number;
  /** URL to access the uploaded file */
  source_url: string;
  /** Timestamp when the resume was uploaded */
  uploaded_at: string;
  /** Whether the resume was successfully parsed */
  parsed: boolean;
  /** Current processing status */
  processing: ResumeProcessingInfo;
  /** Resume analysis results */
  analysis: ResumeMatchAnalysis | null;
  /** Computed resume score (0-100) */
  resume_score: number | null;
  /** Pass/fail decision from screening */
  pass_fail: boolean | null;
}

/**
 * Response containing job details and all associated resumes.
 */
export interface JobResumesResponse {
  /** ID of the job */
  job_id: string;
  /** Full job details */
  job: Job | null;
  /** List of resumes submitted for this job */
  resumes: JobResumeInfoResponse[];
}

/**
 * Response containing job details and all associated candidates.
 */
export interface JobCandidatesResponse {
  /** ID of the job */
  job_id: string;
  /** List of candidates who applied for this job */
  candidates: CandidateResponse[];
}
