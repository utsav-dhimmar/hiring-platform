export interface ResumeProcessingInfo {
  status: string;
  error: string | null;
}

export interface ResumeMatchAnalysis {
  match_percentage: number;
  skill_gap_analysis: string;
  experience_alignment: string;
  strength_summary: string;
  missing_skills: string[];
  extraordinary_points: string[];
}

export interface ResumeUploadResponse {
  message: string;
  job_id: string;
  candidate_id: string;
  file_id: string;
  resume_id: string;
  file_name: string;
  file_type: string;
  size: number;
  source_url: string;
  parsed: boolean;
  processing: ResumeProcessingInfo;
  analysis: ResumeMatchAnalysis | null;
}

export interface ResumeStatusResponse {
  job_id: string;
  candidate_id: string;
  file_id: string;
  resume_id: string;
  file_name: string;
  file_type: string;
  size: number;
  source_url: string;
  parsed: boolean;
  processing: ResumeProcessingInfo;
  analysis: ResumeMatchAnalysis | null;
}

export interface CandidateResponse {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  current_status: string | null;
  created_at: string;
  resume_analysis: ResumeMatchAnalysis | null;
  resume_score: number | null;
  pass_fail: boolean | null;
  is_parsed: boolean;
  processing_status: string | null;
}

export interface JobResumeInfoResponse {
  job_id: string;
  candidate_id: string;
  candidate_first_name: string | null;
  candidate_last_name: string | null;
  candidate_email: string | null;
  file_id: string;
  resume_id: string;
  file_name: string;
  file_type: string;
  size: number;
  source_url: string;
  uploaded_at: string;
  parsed: boolean;
  processing: ResumeProcessingInfo;
  analysis: ResumeMatchAnalysis | null;
  resume_score: number | null;
  pass_fail: boolean | null;
}

import type { Job } from "./job";

export interface JobResumesResponse {
  job_id: string;
  job: Job | null;
  resumes: JobResumeInfoResponse[];
}

export interface JobCandidatesResponse {
  job_id: string;
  candidates: CandidateResponse[];
}
