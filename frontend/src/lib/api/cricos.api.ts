import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('outvier_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const cricosApi = {
  getResources: () => api.get('/admin/cricos/resources'),
  inspectFields: (resourceId: string) => api.post('/admin/cricos/inspect-fields', { resourceId }),
  previewProvider: (providerCode: string) => api.post('/admin/cricos/preview-provider', { providerCode }),
  syncProvider: (providerCode: string) => api.post('/admin/cricos/sync-provider', { providerCode }),
  syncUniversity: (universityId: string) => api.post(`/admin/cricos/sync-university/${universityId}`),
  getSyncRuns: (page = 1) => api.get(`/admin/cricos/sync-runs?page=${page}`),
  getSyncRun: (id: string) => api.get(`/admin/cricos/sync-runs/${id}`),
  getRawInstitutions: (params: any) => api.get('/admin/cricos/raw/institutions', { params }),
  getRawCourses: (params: any) => api.get('/admin/cricos/raw/courses', { params }),
};
