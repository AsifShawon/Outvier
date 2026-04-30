import api from '../api';

export const profileApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data: Record<string, any>) => api.put('/profile', data),
  saveUniversity: (universityId: string) => api.post('/profile/save-university', { universityId }),
  unsaveUniversity: (universityId: string) => api.post('/profile/unsave-university', { universityId }),
  saveProgram: (programId: string) => api.post('/profile/save-program', { programId }),
  unsaveProgram: (programId: string) => api.post('/profile/unsave-program', { programId }),
};
