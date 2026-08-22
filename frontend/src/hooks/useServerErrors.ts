'use client';

import { useCallback } from 'react';
import {
  type FieldPath,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';

interface ServerFieldError {
  field: string;
  message: string;
}

interface ServerErrorPayload {
  success: false;
  message: string;
  errors?: ServerFieldError[];
}

/**
 * Returns a handler that maps server validation errors onto RHF field errors.
 *
 * The server is expected to return errors in the shape:
 * ```json
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": [{ "field": "name", "message": "Name already taken" }]
 * }
 * ```
 *
 * Field-level errors are set via `methods.setError`.
 * If no field errors are present, or no matching field exists, the message
 * is set on the synthetic `root.serverError` field for display in FormSummary.
 *
 * Usage:
 * ```tsx
 * const mapServerErrors = useServerErrors(methods);
 * // inside mutation onError:
 * mapServerErrors(err);
 * ```
 */
export function useServerErrors<TFieldValues extends FieldValues>(
  methods: UseFormReturn<TFieldValues>
) {
  return useCallback(
    (error: unknown) => {
      // Extract the response data from an Axios-like error
      const payload =
        (
          error as {
            response?: { data?: ServerErrorPayload };
          }
        )?.response?.data ?? (error as ServerErrorPayload | undefined);

      if (!payload) {
        methods.setError('root.serverError' as FieldPath<TFieldValues>, {
          message: 'An unexpected error occurred. Please try again.',
        });
        return;
      }

      const fieldErrors = payload.errors ?? [];
      let mappedAny = false;

      for (const { field, message } of fieldErrors) {
        // Only set error if the field exists in the schema (registered fields)
        const registeredFields = methods.getValues();
        if (field in registeredFields) {
          methods.setError(field as FieldPath<TFieldValues>, {
            type: 'server',
            message,
          });
          mappedAny = true;
        }
      }

      // If no fields were mapped (or there are no field errors), set a root error
      if (!mappedAny || fieldErrors.length === 0) {
        methods.setError('root.serverError' as FieldPath<TFieldValues>, {
          message: payload.message || 'Server error. Please check the form and try again.',
        });
      }
    },
    [methods]
  );
}
