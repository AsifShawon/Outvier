import api from '../api';

// Force rebuild
export const trackerApi = {
  getApplications: () => api.get('/tracker'),
  addApplication: (data: { programId: string; status?: string; notes?: string; deadline?: string }) => 
    api.post('/tracker', data),
  updateStatus: (id: string, data: { status: string; notes?: string; deadline?: string }) => 
    api.patch(`/tracker/${id}`, data),
  removeApplication: (id: string) => api.delete(`/tracker/${id}`),
};
