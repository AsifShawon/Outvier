import api from '../api';

export const comparisonApi = {
  createSession: () => api.post('/comparison/create'),
  getSession: (hash: string) => api.get(`/comparison/${hash}`),
  updateSession: (hash: string, data: any) => api.put(`/comparison/${hash}`, data),
  addProgram: (hash: string, programId: string) =>
    api.post(`/comparison/${hash}/add-program`, { programId }),
  removeProgram: (hash: string, programId: string) =>
    api.delete(`/comparison/${hash}/remove-program`, { data: { programId } }),
  getScores: (hash: string) => api.get(`/comparison/${hash}/scores`),
};
