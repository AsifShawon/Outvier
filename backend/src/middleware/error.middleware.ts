import { Request, Response, NextFunction } from 'express';
import { sendError, FieldError, generateRequestId } from '../utils/response.util';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fieldErrors?: FieldError[];
  isOperational?: boolean;
}

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  (req as any).id = (req.headers['x-request-id'] as string) || generateRequestId();
  res.setHeader('X-Request-Id', (req as any).id);
  next();
};

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || (
    statusCode === 400 ? 'BAD_REQUEST' :
    statusCode === 401 ? 'UNAUTHORIZED' :
    statusCode === 403 ? 'FORBIDDEN' :
    statusCode === 404 ? 'NOT_FOUND' :
    statusCode === 409 ? 'CONFLICT' :
    statusCode === 429 ? 'TOO_MANY_REQUESTS' :
    'INTERNAL_SERVER_ERROR'
  );

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] [${(req as any).id}] ${statusCode} ${code} - ${message}`);
    if (statusCode === 500 && err.stack) {
      console.error(err.stack);
    }
  }

  sendError(
    res,
    statusCode,
    code,
    message,
    err.fieldErrors,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const err: AppError = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
};
