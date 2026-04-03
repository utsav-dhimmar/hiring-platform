import apiClient from "./client";

export interface ResumeScreeningDecision {
  id: string;
  candidate_id: string;
  decision: "approve" | "reject" | "maybe";
  note: string | null;
  user_id: string;
  created_at: string;
}

export interface ResumeScreeningDecisionCreate {
  candidate_id: string;
  decision: "approve" | "reject" | "maybe";
  note?: string;
}

export interface HrDecisionHistoryItem {
  id: string;
  candidate_id: string;
  stage_config_id: string | null;
  user_id: string;
  decision: "proceed" | "reject" | "May Be";
  notes: string | null;
  decided_at: string;
}

export interface HrDecisionHistoryResponse {
  candidate_id: string;
  decisions: HrDecisionHistoryItem[];
  total_decisions: number;
  may_be_count: number;
}

export const resumeScreeningApi = {
  submitDecision: async (data: ResumeScreeningDecisionCreate) => {
    const response = await apiClient.post<ResumeScreeningDecision>(
      `/resume-screening/decision`,
      data
    );
    return response.data;
  },

  getDecision: async (candidateId: string) => {
    const response = await apiClient.get<ResumeScreeningDecision | null>(
      `/resume-screening/candidate/${candidateId}`
    );
    return response.data;
  },

  getDecisionHistory: async (candidateId: string) => {
    const response = await apiClient.get<HrDecisionHistoryResponse>(
      `/candidates/${candidateId}/decisions`
    );
    return response.data;
  },
};
