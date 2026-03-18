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
