import api from '../api';
import { University, CreateUniversityPayload } from '@/types/university';
import { ApiResponse } from '@/types/api';

export const universitiesApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/universities', { params }),

  getBySlug: (slug: string): Promise<{ data: ApiResponse<University> }> =>
    api.get(`/universities/${slug}`),

  getPrograms: (slug: string, params?: Record<string, string | number>) =>
    api.get(`/programs`, { params: { ...params, universitySlug: slug } }),

  getStates: (): Promise<{ data: ApiResponse<string[]> }> =>
    api.get('/universities/states'),

  // Admin
  create: (data: CreateUniversityPayload): Promise<{ data: ApiResponse<University> }> =>
    api.post('/admin/universities', data),

  update: (id: string, data: Partial<CreateUniversityPayload>): Promise<{ data: ApiResponse<University> }> =>
    api.put(`/admin/universities/${id}`, data),

  delete: (id: string): Promise<{ data: ApiResponse<null> }> =>
    api.delete(`/admin/universities/${id}`),
};
