import { Response } from 'express';
import crypto from 'crypto';

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

export function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  pagination?: PaginationMeta,
  meta?: Record<string, unknown>,
  statusCode = 200
): void {
  const requestId = (res.req as any)?.id || generateRequestId();
  const responsePayload: StandardSuccessResponse<T> = {
    success: true,
    data,
    ...(pagination && { pagination }),
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  res.status(statusCode).json(responsePayload);
}

export function sendError(
  res: Response,
  statusCode = 400,
  code = 'BAD_REQUEST',
  message = 'Request failed',
  fieldErrors?: FieldError[],
  meta?: Record<string, unknown>
): void {
  const requestId = (res.req as any)?.id || generateRequestId();
  const errorPayload: StandardErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(fieldErrors && fieldErrors.length > 0 && { fieldErrors }),
      requestId,
      timestamp: new Date().toISOString(),
      ...(meta && { meta }),
    },
  };

  res.status(statusCode).json(errorPayload);
}
