import api from '../api';
import { Scholarship, CreateScholarshipPayload, UpdateScholarshipPayload } from '../../types/scholarship';

// Public endpoints
export const scholarshipsApi = {
  getScholarships: async (params?: Record<string, string | number | boolean | undefined>) => {
    return api.get<{ success: boolean; data: Scholarship[]; meta: { total: number; page: number; limit: number; pages?: number } }>('/scholarships', { params });
  },

  getScholarshipBySlug: async (slug: string) => {
    return api.get<{ success: boolean; data: Scholarship }>(`/scholarships/${slug}`);
  },
};

// Admin endpoints
export const adminScholarshipsApi = {
  getScholarships: async (params?: Record<string, string | number | boolean | undefined>) => {
    return api.get<{ success: boolean; data: Scholarship[]; meta: { total: number; page: number; limit: number; pages?: number } }>('/admin/scholarships', { params });
  },

  getScholarship: async (id: string) => {
    return api.get<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}`);
  },

  createScholarship: async (data: CreateScholarshipPayload) => {
    return api.post<{ success: boolean; data: Scholarship }>('/admin/scholarships', data);
  },

  updateScholarship: async (id: string, data: UpdateScholarshipPayload) => {
    return api.patch<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}`, data);
  },

  archiveScholarship: async (id: string, reason?: string) => {
    return api.patch<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}/archive`, { reason });
  },

  restoreScholarship: async (id: string) => {
    return api.patch<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}/restore`);
  },

  changeStatus: async (id: string, status: string) => {
    return api.patch<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}/status`, { status });
  },

  featureScholarship: async (id: string, featured: boolean) => {
    return api.patch<{ success: boolean; data: Scholarship }>(`/admin/scholarships/${id}/feature`, { featured });
  },
};
