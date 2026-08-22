import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError, FieldError } from '../utils/response.util';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export interface ValidatedRequest<B = any, Q = any, P = any> extends Request {
  validated?: {
    body?: B;
    query?: Q;
    params?: P;
  };
}

export const validateRequest = (schemas: ValidationSchemas) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const fieldErrors: FieldError[] = [];
    const validatedResult: { body?: any; query?: any; params?: any } = {};

    if (schemas.params) {
      const parsed = schemas.params.safeParse(req.params);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => {
          fieldErrors.push({
            field: `params.${err.path.join('.') || 'root'}`,
            message: err.message,
          });
        });
      } else {
        req.params = parsed.data;
        validatedResult.params = parsed.data;
      }
    }

    if (schemas.query) {
      const parsed = schemas.query.safeParse(req.query);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => {
          fieldErrors.push({
            field: `query.${err.path.join('.') || 'root'}`,
            message: err.message,
          });
        });
      } else {
        req.query = parsed.data;
        validatedResult.query = parsed.data;
      }
    }

    if (schemas.body) {
      const parsed = schemas.body.safeParse(req.body);
      if (!parsed.success) {
        parsed.error.errors.forEach((err) => {
          fieldErrors.push({
            field: `body.${err.path.join('.') || 'root'}`,
            message: err.message,
          });
        });
      } else {
        req.body = parsed.data;
        validatedResult.body = parsed.data;
      }
    }

    if (fieldErrors.length > 0) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Request validation failed', fieldErrors);
      return;
    }

    (req as ValidatedRequest).validated = validatedResult;
    next();
  };
};

// Legacy body validation wrapper
export const validate = (schema: ZodSchema) => {
  return validateRequest({ body: schema });
};
