import apiClient from "@/apis/client";
import type {
  TranscriptUploadResponse,
  // TranscriptStatusResponse
} from "@/types/transcript";

/**
 * API service for transcript upload operations.
 * Handles interview transcript and candidate stage transcription uploads.
 */
export const transcriptService = {
  /**
   * Upload a transcript file for an interview.
   * @param interviewId - UUID of the interview to upload transcript for.
   * @param file - Transcript file (.docx).
   * @returns Upload response with success status.
   */
  uploadTranscript: async (interviewId: string, file: File): Promise<TranscriptUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<TranscriptUploadResponse>(
      `/interviews/${interviewId}/transcript`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  /**
   * Upload a transcription file for a specific candidate stage.
   * @param candidateStageId - UUID of the candidate stage to upload transcription for.
   * @param file - Transcription file (.txt, .docx, .pdf).
   * @returns Upload response with success status.
   */
  uploadTranscription: async (
    candidateStageId: string,
    file: File,
  ): Promise<TranscriptUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<TranscriptUploadResponse>(
      `/candidate-stages/${candidateStageId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};
