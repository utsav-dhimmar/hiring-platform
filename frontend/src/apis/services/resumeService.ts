import apiClient from "../client";
import type {
  ResumeUploadResponse,
  ResumeStatusResponse,
  JobCandidatesResponse,
  JobResumesResponse,
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

  getJobCandidates: async (jobId: string): Promise<JobCandidatesResponse> => {
    const response = await apiClient.get<JobCandidatesResponse>(
      `/jobs/${jobId}/candidates`,
    );
    return response.data;
  },

  getJobResumes: async (jobId: string): Promise<JobResumesResponse> => {
    const response = await apiClient.get<JobResumesResponse>(`/jobs/${jobId}`);
    return response.data;
  },
};
