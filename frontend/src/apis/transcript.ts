import apiClient from "@/apis/client";
import type { TranscriptUploadResponse, TranscriptStatusResponse } from "@/types/transcript";

/**
 * Service for Transcript upload and status.
 */
export const transcriptService = {
  /**
   * Upload a transcript file for an interview.
   * @param interviewId - UUID of the interview.
   * @param file - Transcript file (.docx).
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
   * Get the processing status of a transcript.
   * @param interviewId - UUID of the interview.
   * @param transcriptId - UUID of the transcript.
   */
  getTranscriptStatus: async (
    interviewId: string,
    transcriptId: string,
  ): Promise<TranscriptStatusResponse> => {
    const response = await apiClient.get<TranscriptStatusResponse>(
      `/interviews/${interviewId}/transcript/${transcriptId}`,
    );
    return response.data;
  },
};
