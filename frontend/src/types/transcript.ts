/**
 * Type definitions for interview transcript processing.
 */

/**
 * A single turn in the interview dialogue.
 */
export interface DialogueTurn {
  /** Name of the speaker (e.g., "Interviewer", "Candidate") */
  speaker: string;
  /** Timestamp when this turn occurred */
  timestamp: string;
  /** Text content of the dialogue turn */
  text: string;
}

/**
 * Metadata about the interview session.
 */
export interface TranscriptMetadata {
  /** Name of the candidate interviewed */
  candidate_name: string;
  /** Name of the interviewer */
  interviewer_name: string;
  /** Date and time of the interview */
  interview_date: string;
  /** Duration of the interview */
  duration: string;
  /** Position or job title being interviewed for */
  position: string;
}

/**
 * Possible states for transcript processing.
 */
export type TranscriptStatus = "uploaded" | "processing" | "completed" | "failed";

/**
 * Response from uploading a transcript file.
 */
export interface TranscriptUploadResponse {
  /** ID of the uploaded recording */
  recording_id: string;
  /** ID of the generated transcript */
  transcript_id: string;
  /** ID of the associated interview */
  interview_id: string;
  /** Current processing status */
  status: string;
  /** Human-readable status message */
  message: string;
}

/**
 * Response containing transcript status and content.
 */
export interface TranscriptStatusResponse {
  /** Unique identifier for the transcript */
  transcript_id: string;
  /** ID of the source recording */
  recording_id: string;
  /** ID of the associated interview */
  interview_id: string;
  /** Current processing status */
  status: TranscriptStatus;
  /** Interview metadata if available */
  metadata: TranscriptMetadata | null;
  /** Number of dialogue turns in the transcript */
  dialogue_count: number;
  /** Array of dialogue turns */
  dialogues: DialogueTurn[];
  /** Cleaned text version of the transcript */
  clean_text: string | null;
  /** Timestamp when the transcript was generated */
  generated_at: string | null;
  /** Error message if processing failed */
  error: string | null;
}
