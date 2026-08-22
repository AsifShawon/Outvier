import { cn } from '@/lib/utils';

interface FieldErrorProps {
  children: React.ReactNode;
  /** ID used by aria-describedby on the associated input */
  id?: string;
  className?: string;
}

/**
 * Inline field error message.
 *
 * Uses `role="alert"` + `aria-live="polite"` so that screen readers announce
 * the error when it appears after interaction.
 *
 * The `id` prop must match what is set on the input's `aria-describedby`.
 * `FormField` handles this automatically.
 */
export function FieldError({ children, id, className }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className={cn('text-xs text-destructive font-medium', className)}
    >
      {children}
    </p>
  );
}
