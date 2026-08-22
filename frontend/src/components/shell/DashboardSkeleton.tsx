import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface DashboardSkeletonProps {
  metricsCount?: number;
  showChart?: boolean;
  tableRows?: number;
  className?: string;
}

export function DashboardSkeleton({
  metricsCount = 4,
  showChart = true,
  tableRows = 5,
  className,
}: DashboardSkeletonProps) {
  return (
    <div className={cn('space-y-6 w-full animate-pulse', className)} aria-busy="true" aria-label="Loading dashboard content">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-border/60">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-xl" />
          <Skeleton className="h-4 w-80 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Metrics Row */}
      {metricsCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: metricsCount }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-surface space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-3 w-40 rounded-md" />
            </div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-5 rounded-2xl border border-border bg-surface space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
            <Skeleton className="h-5 w-32 rounded-lg" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      )}

      {/* Table Skeleton */}
      {tableRows > 0 && (
        <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36 rounded-lg" />
            <Skeleton className="h-8 w-48 rounded-xl" />
          </div>
          <div className="space-y-2.5">
            {Array.from({ length: tableRows }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
