import api from '../api';
import { ApiResponse } from '@/types/api';

export interface ApplicationTracker {
  _id: string;
  programId: string;
  programName: string;
  universityId: string;
  universityName: string;
  status: 'shortlisted' | 'preparing_documents' | 'applied' | 'visa_process' | 'enrolled' | 'archived';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  deadline?: string;
  intake?: string;
  documentChecklist: {
    name: string;
    required: boolean;
    status: 'pending' | 'uploaded' | 'verified';
    fileUrl?: string;
  }[];
  tasks: {
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
  history: {
    status: string;
    changedAt: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export const applicationTrackerApi = {
  getAll: (): Promise<{ data: ApiResponse<ApplicationTracker[]> }> =>
    api.get('/tracker'),

  create: (data: any): Promise<{ data: ApiResponse<ApplicationTracker> }> =>
    api.post('/tracker', data),

  updateStatus: (id: string, status: string): Promise<{ data: ApiResponse<ApplicationTracker> }> =>
    api.patch(`/tracker/${id}`, { status }),

  updateDocuments: (id: string, checklist: any[]): Promise<{ data: ApiResponse<ApplicationTracker> }> =>
    api.patch(`/tracker/${id}`, { documentChecklist: checklist }),

  delete: (id: string): Promise<{ data: ApiResponse<void> }> =>
    api.delete(`/tracker/${id}`),
};
