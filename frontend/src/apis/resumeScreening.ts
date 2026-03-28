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
};
