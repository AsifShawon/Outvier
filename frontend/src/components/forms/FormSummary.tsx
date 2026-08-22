'use client';

import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormSummaryProps {
  /** Additional class names */
  className?: string;
  /**
   * Label map from field name → human-readable label, used in the
   * error list. Falls back to the raw field name if not supplied.
   */
  labels?: Record<string, string>;
}

/**
 * Error summary panel that appears after a failed submit attempt.
 *
 * - Lists all current field errors with anchor links to the offending field.
 * - Displays root-level server errors (set on `root.serverError`).
 * - Focuses itself on mount (or when errors change) so keyboard/screen-reader
 *   users are immediately informed.
 * - Uses `role="alert"` so the announcement is automatic.
 *
 * Place this near the top of the `<form>` element.
 *
 * ```tsx
 * <FormSummary labels={{ name: 'University Name', state: 'State' }} />
 * ```
 */
export function FormSummary({ className, labels = {} }: FormSummaryProps) {
  const {
    formState: { errors, isSubmitted },
  } = useFormContext();

  const ref = useRef<HTMLDivElement>(null);

  // Flatten errors to a list of { field, message } pairs
  const fieldErrors = flattenErrors(errors, labels);
  const rootErrors = errors as Record<string, Record<string, unknown> | undefined>;
  const serverError = rootErrors?.root?.serverError as
    | { message?: string }
    | undefined;

  const hasErrors = fieldErrors.length > 0 || Boolean(serverError?.message);

  // Focus the summary when it appears (submit attempted with errors)
  useEffect(() => {
    if (isSubmitted && hasErrors && ref.current) {
      ref.current.focus();
    }
  }, [isSubmitted, hasErrors]);

  if (!isSubmitted || !hasErrors) return null;

  return (
    <div
      ref={ref}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      tabIndex={-1}
      className={cn(
        'rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-3 outline-none',
        className
      )}
    >
      <div className="flex items-center gap-2 text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="font-semibold text-sm">
          Please fix the following before submitting
        </p>
      </div>

      {serverError?.message && (
        <p className="text-sm text-destructive">{serverError.message}</p>
      )}

      {fieldErrors.length > 0 && (
        <ul className="space-y-1 list-disc list-inside">
          {fieldErrors.map(({ field, label, message }) => (
            <li key={field} className="text-sm text-destructive">
              <a
                href={`#field-${field}`}
                className="underline underline-offset-2 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  // Focus the element with aria-describedby containing this field
                  const el = document.querySelector<HTMLElement>(
                    `[id^="field-"][name="${field}"], [id^="field-"][data-name="${field}"]`
                  );
                  el?.focus();
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                {label}
              </a>
              {': '}
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

interface FlatError {
  field: string;
  label: string;
  message: string;
}

function flattenErrors(
  errors: Record<string, unknown>,
  labels: Record<string, string>,
  prefix = ''
): FlatError[] {
  const result: FlatError[] = [];

  for (const [key, value] of Object.entries(errors)) {
    if (key === 'root') continue; // handled separately

    const fieldPath = prefix ? `${prefix}.${key}` : key;

    if (
      value &&
      typeof value === 'object' &&
      'message' in value &&
      typeof (value as { message?: unknown }).message === 'string'
    ) {
      result.push({
        field: fieldPath,
        label: labels[fieldPath] ?? labels[key] ?? fieldPath,
        message: (value as { message: string }).message,
      });
    } else if (value && typeof value === 'object') {
      result.push(
        ...flattenErrors(
          value as Record<string, unknown>,
          labels,
          fieldPath
        )
      );
    }
  }

  return result;
}
