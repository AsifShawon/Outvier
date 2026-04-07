import api from '../api';
import { DashboardStats, UploadJob } from '@/types/api';
import { ApiResponse } from '@/types/api';

export const adminApi = {
  getStats: (): Promise<{ data: ApiResponse<DashboardStats> }> =>
    api.get('/admin/dashboard/stats'),

  getUsers: () => api.get('/admin/users'),

  getUploadHistory: (): Promise<{ data: ApiResponse<UploadJob[]> }> =>
    api.get('/admin/uploads'),
};
