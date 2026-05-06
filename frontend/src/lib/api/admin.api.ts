import api from '../api';
import { DashboardStats, UploadJob } from '@/types/api';
import { ApiResponse } from '@/types/api';

export const adminApi = {
  // ── Existing ──────────────────────────────────────────────────────────────
  getStats: (): Promise<{ data: ApiResponse<DashboardStats> }> =>
    api.get('/admin/dashboard/stats'),

  getActivities: (): Promise<{ data: ApiResponse<any[]> }> =>
    api.get('/admin/dashboard/activities'),

  getRecentAdditions: (): Promise<{ data: ApiResponse<any> }> =>
    api.get('/admin/dashboard/recent-additions'),

  getUsers: () => api.get('/admin/users'),

  getUploadHistory: (): Promise<{ data: ApiResponse<UploadJob[]> }> =>
    api.get('/admin/uploads'),

  // ── Seed imports ──────────────────────────────────────────────────────────
  listImports: () => api.get('/admin/imports'),
  getImport: (id: string) => api.get(`/admin/imports/${id}`),
  // Confirmation uses the stored importId only — no rows sent from client
  confirmImport: (id: string) => api.post(`/admin/imports/${id}/confirm`),
  cancelImport: (id: string) => api.post(`/admin/imports/${id}/cancel`),

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
  bulkApproveStagedChanges: (ids: string[]) =>
    api.post('/admin/staged-changes/bulk-approve', { ids }),
  bulkRejectStagedChanges: (ids: string[]) =>
    api.post('/admin/staged-changes/bulk-reject', { ids }),
  bulkApproveCricos: (params: { providerCode?: string; entityType?: string } = {}) =>
    api.post('/admin/staged-changes/bulk-approve-cricos', params),

  // ── Sync Jobs ─────────────────────────────────────────────────────────────
  listSyncJobs: (params: Record<string, string> = {}) =>
    api.get('/admin/sync/jobs', { params }),
  triggerUniversitySync: (id: string) =>
    api.post(`/admin/sync/university/${id}`),
  triggerAllUniversitySync: () =>
    api.post('/admin/sync/university/all'),

  // ── Analytics ─────────────────────────────────────────────────────────────
  getPowerBiToken: () => api.get('/admin/analytics/powerbi/token'),
  getAdminAnalytics: () => api.get('/admin/analytics'),

  // ── AI Settings ───────────────────────────────────────────────────────────
  getAISettings: () => api.get('/admin/settings/ai'),
  upsertAISetting: (data: { provider: string; aiModel: string; apiKey?: string; baseUrl?: string; isActive?: boolean }) =>
    api.post('/admin/settings/ai', data),
  testAIConnection: (provider: string) => api.post('/admin/settings/ai/test', { provider }),
  activateAIProvider: (provider: string) => api.post('/admin/settings/ai/activate', { provider }),
};
