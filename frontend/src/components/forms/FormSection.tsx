import { cn } from '@/lib/utils';

interface FormSectionProps {
  /** Section heading */
  title: string;
  /** Optional short description below the heading */
  description?: string;
  /** Content — typically FormField components */
  children: React.ReactNode;
  /**
   * Number of columns on desktop.
   * - `2` (default) — two-column grid on md+, single column below.
   * - `1` — always single column.
   */
  columns?: 1 | 2;
  /** Additional class names on the container */
  className?: string;
  /** Optional HTML id for the section (useful for skip-links) */
  id?: string;
}

/**
 * A contained surface card with a heading and grid layout for form fields.
 *
 * ```tsx
 * <FormSection title="Identity" description="Basic information about the university.">
 *   <FormField name="name" label="Name" required><Input /></FormField>
 *   <FormField name="type" label="Type" required><Select /></FormField>
 * </FormSection>
 * ```
 */
export function FormSection({
  title,
  description,
  children,
  columns = 2,
  className,
  id,
}: FormSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={cn(
        'rounded-xl border border-border/60 bg-card p-6 space-y-5',
        className
      )}
    >
      {/* Section header */}
      <div className="space-y-0.5">
        <h2
          id={id ? `${id}-heading` : undefined}
          className="font-semibold text-sm uppercase tracking-wide text-muted-foreground"
        >
          {title}
        </h2>
        {description && (
          <p className="text-xs text-muted-foreground/80">{description}</p>
        )}
      </div>

      {/* Field grid */}
      <div
        className={cn(
          'grid gap-4',
          columns === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        )}
      >
        {children}
      </div>
    </section>
  );
}
