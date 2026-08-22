'use client';

import * as React from 'react';
import { SearchX, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export function DataTableEmptyState({
  title = 'No records found',
  description = 'Try adjusting your search query or removing active filters to find what you are looking for.',
  onResetFilters,
  actionLabel,
  onAction,
}: DataTableEmptyStateProps) {
  return (
    <div className="py-16 px-4 text-center flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/40 dark:bg-slate-800 text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold font-display text-foreground">{title}</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {onResetFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="text-xs rounded-xl h-8 gap-1.5"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filters</span>
          </Button>
        )}
        {actionLabel && onAction && (
          <Button
            size="sm"
            onClick={onAction}
            className="text-xs rounded-xl h-8 gap-1.5 bg-primary text-primary-foreground font-semibold"
          >
            <Plus className="h-3 w-3" />
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
