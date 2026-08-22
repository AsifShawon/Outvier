import { cn } from '@/lib/utils';

interface FieldHelpProps {
  children: React.ReactNode;
  /** ID used by aria-describedby on the associated input */
  id?: string;
  className?: string;
}

/**
 * Small hint text displayed below an input field.
 *
 * The `id` prop must match what is set on the input's `aria-describedby`.
 * `FormField` handles this automatically.
 */
export function FieldHelp({ children, id, className }: FieldHelpProps) {
  return (
    <p
      id={id}
      className={cn('text-xs text-muted-foreground', className)}
    >
      {children}
    </p>
  );
}
