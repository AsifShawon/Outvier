export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page?: number;
  limit: number;
  total?: number;
  totalPages?: number;
  nextCursor?: string | null;
  hasNext: boolean;
}

export interface StandardMeta {
  requestId: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface StandardSuccessResponse<T> {
  success: true;
  data: T;
  pagination?: PaginationMeta;
  meta: StandardMeta;
}

export interface StandardErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fieldErrors?: FieldError[];
    requestId: string;
    timestamp: string;
    meta?: Record<string, unknown>;
  };
}

export interface StandardPaginationQuery {
  page?: number;
  limit?: number;
  cursor?: string;
  search?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}
