import api from '../api';

export const profileApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data: Record<string, any>) => api.put('/profile', data),
};
