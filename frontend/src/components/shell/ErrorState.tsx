import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Failed to load data',
  description = 'An error occurred while fetching information. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 min-h-[320px]', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mb-4 border border-destructive/20">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-base font-bold font-display text-foreground mb-1.5">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-sm mb-6">
        {description}
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="gap-2 border-destructive/30 hover:bg-destructive/10 text-foreground">
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
}
