import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  questionAnswered?: string;
  accessibleSummary?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  questionAnswered,
  accessibleSummary,
  actions,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={cn('bg-surface border-border rounded-2xl shadow-sm overflow-hidden', className)}>
      <CardHeader className="p-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50">
        <div className="space-y-1">
          <CardTitle className="text-base font-bold font-display text-foreground">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {questionAnswered && (
          <div className="text-[11px] font-medium text-muted-foreground bg-surface-elevated px-3 py-1.5 rounded-lg border border-border/40 inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span>Key Question: {questionAnswered}</span>
          </div>
        )}

        <div className="w-full">
          {children}
        </div>

        {accessibleSummary && (
          <div className="pt-2 border-t border-border/40">
            <p className="sr-only" aria-live="polite">
              Chart data summary: {accessibleSummary}
            </p>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Summary: </span>
              {accessibleSummary}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
