export type InterviewStatus = "pending" | "completed" | "rejected" | "cancelled";

export interface InterviewRead {
  id: string;
  candidate_id: string;
  job_id: string;
  interviewer_id: string;
  status: InterviewStatus;
  created_at: string;
}

export interface InterviewListResponse {
  interviews: InterviewRead[];
  total: number;
}

export interface InterviewCreate {
  candidate_id: string;
  job_id: string;
}

export interface InterviewDecision {
  decision: "proceed" | "reject";
  notes?: string;
}
