import api from '../api';
import { ApiResponse } from '@/types/api';

export interface TrackerColumn {
  id: string;
  title: string;
  color?: string;
  order: number;
  isArchived: boolean;
}

export interface TrackerBoard {
  _id: string;
  userId: string;
  name: string;
  columns: TrackerColumn[];
  settings: {
    showDeadlines: boolean;
    showPriority: boolean;
    showDocuments: boolean;
    showTasks: boolean;
    compactMode: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TrackerDocument {
  id: string;
  name: string;
  status: 'pending' | 'uploaded' | 'verified' | 'completed' | 'not_required';
  fileUrl?: string;
  updatedAt: string;
}

export interface TrackerTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  createdAt: string;
}

export interface TrackerHistory {
  type: 'created' | 'moved' | 'edited' | 'document_updated' | 'task_updated' | 'archived';
  fromColumnId?: string;
  toColumnId?: string;
  note?: string;
  updatedAt: string;
}

export interface ApplicationTrackerItem {
  _id: string;
  boardId: string;
  columnId: string;
  order: number;
  itemType: 'university' | 'program' | 'custom';
  programId?: any; // Populated
  universityId?: any; // Populated
  customProgramName?: string;
  customUniversityName?: string;
  title: string;
  subtitle?: string;
  priority: 'low' | 'medium' | 'high';
  intake?: string;
  deadline?: string;
  applicationUrl?: string;
  notes?: string;
  tags: string[];
  documentChecklist: TrackerDocument[];
  tasks: TrackerTask[];
  history: TrackerHistory[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export const applicationTrackerApi = {
  // Board & Columns
  getBoard: (): Promise<{ data: ApiResponse<TrackerBoard> }> =>
    api.get('/tracker/board'),

  updateBoard: (data: Partial<TrackerBoard>): Promise<{ data: ApiResponse<TrackerBoard> }> =>
    api.patch('/tracker/board', data),

  addColumn: (data: { title: string; color?: string }): Promise<{ data: ApiResponse<TrackerColumn> }> =>
    api.post('/tracker/columns', data),

  updateColumn: (columnId: string, data: Partial<TrackerColumn>): Promise<{ data: ApiResponse<TrackerColumn> }> =>
    api.patch(`/tracker/columns/${columnId}`, data),

  reorderColumns: (columns: { id: string; order: number }[]): Promise<{ data: ApiResponse<TrackerColumn[]> }> =>
    api.patch('/tracker/columns/reorder', { columns }),

  // Items
  getItems: (params?: any): Promise<{ data: ApiResponse<ApplicationTrackerItem[]> }> =>
    api.get('/tracker/items', { params }),

  getItem: (id: string): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.get(`/tracker/items/${id}`),

  createItem: (data: any): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.post('/tracker/items', data),

  updateItem: (id: string, data: any): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}`, data),

  moveItem: (id: string, toColumnId: string, order?: number): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}/move`, { toColumnId, order }),

  reorderItems: (columnId: string, items: { id: string; order: number }[]): Promise<{ data: ApiResponse<void> }> =>
    api.patch('/tracker/items/reorder', { columnId, items }),

  updateDocuments: (id: string, checklist: TrackerDocument[]): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}/documents`, { checklist }),

  updateTasks: (id: string, tasks: TrackerTask[]): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}/tasks`, { tasks }),

  archiveItem: (id: string, archived: boolean = true): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}/archive`, { archived }),

  deleteItem: (id: string): Promise<{ data: ApiResponse<void> }> =>
    api.delete(`/tracker/items/${id}`),

  // Legacy (Map to new methods if needed)
  getAll: (): Promise<{ data: ApiResponse<ApplicationTrackerItem[]> }> =>
    api.get('/tracker/items'),
  
  updateStatus: (id: string, status: string): Promise<{ data: ApiResponse<ApplicationTrackerItem> }> =>
    api.patch(`/tracker/items/${id}/move`, { toColumnId: status }),
};

