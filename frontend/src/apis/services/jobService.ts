import client from '../client';
import type { Job } from '../types/job';

const jobService = {
  getJobs: async (skip = 0, limit = 100): Promise<Job[]> => {
    const response = await client.get<Job[]>('/jobs/', {
      params: { skip, limit },
    });
    return response.data;
  },
};

export default jobService;
