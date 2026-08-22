import { cloneElement, isValidElement, useId } from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { FieldError } from './FieldError';
import { FieldHelp } from './FieldHelp';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  /** RHF field name (dot-notation supported e.g. "careerGoals.targetRole") */
  name: string;
  /** Visible label — always rendered, never replaced by a placeholder */
  label: string;
  /** Whether the field is required (appends asterisk to label) */
  required?: boolean;
  /** Optional hint text shown below the input */
  hint?: string;
  /**
   * The input element. The component will inject `id` and `aria-describedby`
   * unless the child already has them.
   */
  children: React.ReactElement;
  /**
   * When true, the field spans the full width of the parent grid.
   * Implemented via `md:col-span-2`.
   */
  fullWidth?: boolean;
  /** Additional class names on the wrapper div */
  className?: string;
}

/**
 * Accessible field wrapper that links a label, input, help text, and
 * error message via `htmlFor` / `aria-describedby`.
 *
 * Reads the error state directly from the nearest `FormProvider` context,
 * so you don't need to manually pass `errors`.
 *
 * ```tsx
 * <FormField name="name" label="University Name" required hint="Official full name">
 *   <Input placeholder="e.g. University of Melbourne" />
 * </FormField>
 * ```
 */
export function FormField({
  name,
  label,
  required,
  hint,
  children,
  fullWidth,
  className,
}: FormFieldProps) {
  const baseId = useId();
  const inputId = `field-${baseId}`;
  const hintId = hint ? `hint-${baseId}` : undefined;
  const errorId = `error-${baseId}`;

  const {
    formState: { errors },
  } = useFormContext();

  // Traverse dot-notation to get nested error
  const error = name
    .split('.')
    .reduce<Record<string, unknown>>(
      (obj, key) => (obj?.[key] as Record<string, unknown>) ?? {},
      errors as Record<string, unknown>
    ) as { message?: string } | undefined;

  const hasError = Boolean(error?.message);

  // Build aria-describedby from hint and/or error ids
  const ariaDescribedBy =
    [hint ? hintId : null, hasError ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  // Clone child to inject id + aria-describedby + aria-invalid
  const inputEl =
    isValidElement(children)
      ? cloneElement(children as React.ReactElement<Record<string, unknown>>, {
          id: (children.props as Record<string, unknown>).id ?? inputId,
          'aria-describedby':
            (children.props as Record<string, unknown>)['aria-describedby'] ??
            ariaDescribedBy,
          'aria-invalid': hasError ? true : undefined,
        })
      : children;

  return (
    <div
      className={cn('space-y-1.5', fullWidth && 'md:col-span-2', className)}
    >
      <Label htmlFor={inputId}>
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>

      {inputEl}

      {hint && <FieldHelp id={hintId!}>{hint}</FieldHelp>}

      {hasError && (
        <FieldError id={errorId}>{error!.message!}</FieldError>
      )}
    </div>
  );
}
