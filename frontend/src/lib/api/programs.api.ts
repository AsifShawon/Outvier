import api from '../api';
import { Program, CreateProgramPayload } from '@/types/program';
import { ApiResponse } from '@/types/api';

export const programsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/programs', { params }),

  getBySlug: (slug: string): Promise<{ data: ApiResponse<Program> }> =>
    api.get(`/programs/${slug}`),

  getFields: (): Promise<{ data: ApiResponse<string[]> }> =>
    api.get('/programs/fields'),

  getCities: (): Promise<{ data: ApiResponse<string[]> }> =>
    api.get('/programs/cities'),

  // Admin
  create: (data: CreateProgramPayload): Promise<{ data: ApiResponse<Program> }> =>
    api.post('/admin/programs', data),

  update: (id: string, data: Partial<CreateProgramPayload>): Promise<{ data: ApiResponse<Program> }> =>
    api.put(`/admin/programs/${id}`, data),

  delete: (id: string): Promise<{ data: ApiResponse<null> }> =>
    api.delete(`/admin/programs/${id}`),

  bulkUpload: (file: File): Promise<{ data: any }> => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/admin/programs/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
