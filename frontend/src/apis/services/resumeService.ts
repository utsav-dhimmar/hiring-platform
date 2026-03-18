import apiClient from "../client";
import type {
  ResumeUploadResponse,
  ResumeStatusResponse,
} from "../types/resume";

export const resumeService = {
  uploadResume: async (
    jobId: string,
    file: File,
  ): Promise<ResumeUploadResponse> => {
    const formData = new FormData();
    formData.append("resume", file);
    const response = await apiClient.post<ResumeUploadResponse>(
      `/jobs/${jobId}/resume`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  getResumeStatus: async (
    jobId: string,
    resumeId: string,
  ): Promise<ResumeStatusResponse> => {
    const response = await apiClient.get<ResumeStatusResponse>(
      `/jobs/${jobId}/resume/${resumeId}`,
    );
    return response.data;
  },
};
