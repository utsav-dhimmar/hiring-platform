export interface CriterionDetail {
  score: number;
  justification: string;
  evidence: string[];
}

export interface EvaluationScores {
  communication_skill: number;
  confidence: number;
  cultural_fit: number;
  profile_understanding: number;
  tech_stack_alignment: number;
  salary_alignment: number;
  overall_score: number;
}

export type Recommendation = "PROCEED" | "REJECT" | "MAYBE";

export interface EvaluationResult {
  scores: EvaluationScores;
  criteria_detail: {
    "Communication Skill": CriterionDetail;
    Confidence: CriterionDetail;
    "Cultural Fit": CriterionDetail;
    "Profile Understanding": CriterionDetail;
    "Tech Stack Alignment": CriterionDetail;
  };
  red_flags: string[];
  stage_score: number;
  recommendation: Recommendation;
  recommendation_reason: string;
  strength_summary: string;
  weakness_summary: string;
  overall_summary: string;
  suggested_followups: string[];
  filler_count: number;
}

export interface TestEvaluationRequest {
  file: File;
  job_description: string;
  candidate_name?: string;
}

export interface TestRawAgentResponse {
  full_text_length: number;
  candidate_text_length: number;
  filler_count: number;
  message_count: number;
  messages: {
    role: string;
    content: string;
  }[];
}
