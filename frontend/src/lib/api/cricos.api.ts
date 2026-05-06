import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('outvier_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SyncRunsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface RawDataParams {
  providerCode?: string;
  q?: string;
  page?: number;
  limit?: number;
}

export const cricosApi = {
  // Resources
  getResources: () => api.get('/admin/cricos/resources'),

  // Dashboard stats
  getStats: () => api.get('/admin/cricos/stats'),

  // Field inspection
  inspectFields: (resourceId: string) =>
    api.post('/admin/cricos/inspect-fields', { resourceId }),

  // Provider preview
  previewProvider: (providerCode: string) =>
    api.post('/admin/cricos/preview-provider', { providerCode }),

  // Full sync
  syncProvider: (providerCode: string) =>
    api.post('/admin/cricos/sync-provider', { providerCode }),

  // Recheck (detect changes only since last sync)
  recheckProvider: (providerCode: string) =>
    api.post('/admin/cricos/recheck-provider', { providerCode }),

  // Sync via university ObjectId
  syncUniversity: (universityId: string) =>
    api.post(`/admin/cricos/sync-university/${universityId}`),

  // Sync runs
  getSyncRuns: (params: SyncRunsParams = {}) =>
    api.get('/admin/cricos/sync-runs', { params }),

  getSyncRun: (id: string) =>
    api.get(`/admin/cricos/sync-runs/${id}`),

  // Raw data explorers
  getRawInstitutions: (params: RawDataParams = {}) =>
    api.get('/admin/cricos/raw/institutions', { params }),

  getRawCourses: (params: RawDataParams = {}) =>
    api.get('/admin/cricos/raw/courses', { params }),

  getRawLocations: (params: RawDataParams = {}) =>
    api.get('/admin/cricos/raw/locations', { params }),

  getRawCourseLocations: (params: RawDataParams = {}) =>
    api.get('/admin/cricos/raw/course-locations', { params }),
};
