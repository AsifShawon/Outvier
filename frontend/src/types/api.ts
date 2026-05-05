export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data?: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: { field: string; message: string }[];
}

export interface DashboardStats {
  totalUniversities: number;
  totalPrograms: number;
  totalUsers: number;
  programsByLevel: { _id: string; count: number }[];
  universitiesByState: { _id: string; count: number }[];
}

export interface UploadJob {
  _id: string;
  entity: 'universities' | 'programs';
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  successCount: number;
  errorCount: number;
  rowErrors: { row: number; message: string }[];
  createdAt: string;
}
