import api from '../api';
import { ApiResponse } from '@/types/api';
import { StudentDashboardData } from '@/types/studentDashboard';

export const studentDashboardApi = {
  /**
   * Fetch aggregate student dashboard readiness, deadlines, tasks, and fit data.
   */
  getMyDashboard: (): Promise<{ data: ApiResponse<StudentDashboardData> }> =>
    api.get('/dashboard/me'),
};
