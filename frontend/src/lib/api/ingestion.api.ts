import api from '../api';
import { PaginatedResponse } from '@/types/api';
import { IngestionJob } from '@/types/ingestion';

export const ingestionApi = {
  // Get all ingestion jobs
  getJobs: async (params?: { page?: number; limit?: number; status?: string; universityId?: string }) => {
    const { data } = await api.get<PaginatedResponse<IngestionJob>>('/admin/ingestion-jobs', { params });
    return data;
  },

  // Get a single job by ID
  getJob: async (jobId: string) => {
    const { data } = await api.get<{ success: boolean; data: IngestionJob }>(`/admin/ingestion-jobs/${jobId}`);
    return data.data;
  },

  // Get logs for a specific job
  getJobLogs: async (jobId: string) => {
    const { data } = await api.get<{ success: boolean; data: { logs: IngestionJob['logs'], progress: IngestionJob['progress'], status: IngestionJob['status'] } }>(`/admin/ingestion-jobs/${jobId}/logs`);
    return data.data;
  },

  // Retry a failed job
  retryJob: async (jobId: string) => {
    const { data } = await api.post<{ success: boolean; message: string }>(`/admin/ingestion-jobs/${jobId}/retry`);
    return data;
  },

  // Cancel a running job
  cancelJob: async (jobId: string) => {
    const { data } = await api.post<{ success: boolean; message: string }>(`/admin/ingestion-jobs/${jobId}/cancel`);
    return data;
  },

  // Trigger program discovery for a university
  discoverPrograms: async (universityId: string, isRefresh: boolean = false) => {
    const { data } = await api.post<{ success: boolean; message: string; data: { ingestionJobId: string } }>(`/admin/universities/${universityId}/discover-programs`, { isRefresh });
    return data;
  },

  // Refresh a specific field using AI
  refreshProgramField: async (programId: string, field: string) => {
    const { data } = await api.patch<{ success: boolean; message: string; data: any }>(`/admin/programs/${programId}/refresh-field`, { field });
    return data;
  },
};
