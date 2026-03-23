export interface DialogueTurn {
  speaker: string;
  timestamp: string;
  text: string;
}

export interface TranscriptMetadata {
  candidate_name: string;
  interviewer_name: string;
  interview_date: string;
  duration: string;
  position: string;
}

export type TranscriptStatus = "uploaded" | "processing" | "completed" | "failed";

export interface TranscriptUploadResponse {
  recording_id: string;
  transcript_id: string;
  interview_id: string;
  status: string;
  message: string;
}

export interface TranscriptStatusResponse {
  transcript_id: string;
  recording_id: string;
  interview_id: string;
  status: TranscriptStatus;
  metadata: TranscriptMetadata | null;
  dialogue_count: number;
  dialogues: DialogueTurn[];
  clean_text: string | null;
  generated_at: string | null;
  error: string | null;
}
