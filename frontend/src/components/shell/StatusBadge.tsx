import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusBadgeVariant;
  dot?: boolean;
  className?: string;
}

export function StatusBadge({
  children,
  variant = 'neutral',
  dot = false,
  className,
}: StatusBadgeProps) {
  const variantStyles: Record<StatusBadgeVariant, string> = {
    success: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    neutral: 'bg-muted text-muted-foreground border-border',
  };

  const dotStyles: Record<StatusBadgeVariant, string> = {
    success: 'bg-teal-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    info: 'bg-blue-400',
    purple: 'bg-purple-400',
    neutral: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      <span>{children}</span>
    </span>
  );
}
