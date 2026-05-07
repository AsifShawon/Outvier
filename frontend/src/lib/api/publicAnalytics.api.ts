import api from '../api';

export const publicAnalyticsApi = {
  getStats: () => api.get('/analytics/public'),
};
