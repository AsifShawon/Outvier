import api from '../api';
import { DashboardStats, UploadJob } from '@/types/api';
import { ApiResponse } from '@/types/api';

export const adminApi = {
  // ── Existing ──────────────────────────────────────────────────────────────
  getStats: (): Promise<{ data: ApiResponse<DashboardStats> }> =>
    api.get('/admin/dashboard/stats'),

  getUsers: () => api.get('/admin/users'),

  getUploadHistory: (): Promise<{ data: ApiResponse<UploadJob[]> }> =>
    api.get('/admin/uploads'),

  // ── Seed imports ──────────────────────────────────────────────────────────
  listImports: () => api.get('/admin/imports'),
  getImport: (id: string) => api.get(`/admin/imports/${id}`),
  confirmImport: (id: string, rows: unknown[]) =>
    api.post(`/admin/imports/${id}/confirm`, { rows }),

  uploadSeedCSV: (formData: FormData) =>
    api.post('/admin/imports/seed-universities', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // ── Staged changes ────────────────────────────────────────────────────────
  listStagedChanges: (params: Record<string, string> = {}) =>
    api.get('/admin/staged-changes', { params }),
  approveStagedChange: (id: string) =>
    api.post(`/admin/staged-changes/${id}/approve`),
  rejectStagedChange: (id: string) =>
    api.post(`/admin/staged-changes/${id}/reject`),
  editApproveStagedChange: (id: string, newValue: Record<string, unknown>) =>
    api.post(`/admin/staged-changes/${id}/edit-approve`, { newValue }),

  // ── Sync Jobs ─────────────────────────────────────────────────────────────
  listSyncJobs: (params: Record<string, string> = {}) =>
    api.get('/admin/sync/jobs', { params }),
  triggerUniversitySync: (id: string) =>
    api.post(`/admin/sync/university/${id}`),
  triggerAllUniversitySync: () =>
    api.post('/admin/sync/university/all'),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getPowerBiToken: () => api.get('/admin/analytics/powerbi/token'),
};
