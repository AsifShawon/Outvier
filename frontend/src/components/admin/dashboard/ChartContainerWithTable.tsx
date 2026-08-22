'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, BarChart3, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface ChartContainerWithTableProps<T = any> {
  title: string;
  subtitle?: string;
  questionAnswered: string;
  metricDefinition?: string;
  timeScope?: string;
  lastUpdated?: string;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  isEmpty?: boolean;
  emptyMessage?: string;
  tableData?: T[];
  tableColumns?: TableColumn<T>[];
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  className?: string;
  defaultView?: 'chart' | 'table';
}

export function ChartContainerWithTable<T = any>({
  title,
  subtitle,
  questionAnswered,
  metricDefinition,
  timeScope,
  lastUpdated,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load chart data',
  isEmpty = false,
  emptyMessage = 'No data available for the selected filters',
  tableData = [],
  tableColumns = [],
  children,
  headerAction,
  className,
  defaultView = 'chart',
}: ChartContainerWithTableProps<T>) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>(defaultView);

  return (
    <Card
      className={cn(
        'bg-card/90 dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden flex flex-col',
        className
      )}
    >
      {/* Header */}
      <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/60 dark:border-slate-800/60 bg-muted/20 dark:bg-slate-900/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base sm:text-lg font-bold font-display text-foreground tracking-tight">
                {title}
              </CardTitle>
              {metricDefinition && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-full"
                        aria-label="Metric definition"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-slate-900 text-slate-100 border-slate-700 text-xs">
                      {metricDefinition}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>
            )}
          </div>

          {/* Actions: View Toggle + Header Extra */}
          <div className="flex items-center gap-2 shrink-0">
            {headerAction}
            {tableColumns.length > 0 && (
              <div className="flex items-center rounded-lg bg-surface-elevated dark:bg-slate-800/80 p-0.5 border border-border/60 dark:border-slate-700/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('chart')}
                  className={cn(
                    'h-7 px-2.5 text-xs font-medium rounded-md transition-all',
                    viewMode === 'chart'
                      ? 'bg-background dark:bg-slate-900 text-primary dark:text-purple-300 shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Switch to visual chart view"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Chart
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'h-7 px-2.5 text-xs font-medium rounded-md transition-all',
                    viewMode === 'table'
                      ? 'bg-background dark:bg-slate-900 text-primary dark:text-purple-300 shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  aria-label="Switch to accessible tabular summary view"
                >
                  <Table className="h-3.5 w-3.5 mr-1.5" />
                  Table
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Operational Question Banner */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40 dark:border-slate-800/40">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-purple-400 dark:text-purple-300 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
            <span className="font-semibold">Key Question:</span>
            <span>{questionAnswered}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            {timeScope && (
              <span className="bg-surface-elevated dark:bg-slate-800/60 px-2 py-0.5 rounded border border-border/40">
                {timeScope}
              </span>
            )}
            {lastUpdated && (
              <span className="hidden sm:inline">
                Updated: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content Area */}
      <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-center min-h-[260px]">
        {isLoading ? (
          <div className="space-y-3 w-full py-4">
            <Skeleton className="h-8 w-1/3 rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="h-10 w-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">{errorMessage}</p>
            <p className="text-xs text-muted-foreground">Check connection or refresh the dashboard overview.</p>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-muted/40 text-muted-foreground flex items-center justify-center">
              <Info className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">{emptyMessage}</p>
            <p className="text-xs text-muted-foreground">Try broadening your date range or filters.</p>
          </div>
        ) : viewMode === 'table' && tableColumns.length > 0 ? (
          <div className="w-full overflow-x-auto rounded-xl border border-border/60 dark:border-slate-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 dark:bg-slate-900/60 border-b border-border/60 dark:border-slate-800 text-muted-foreground font-semibold">
                <tr>
                  {tableColumns.map((col) => (
                    <th
                      key={col.key}
                      className={cn(
                        'px-3.5 py-2.5 font-semibold text-foreground/80',
                        col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                        col.className
                      )}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 dark:divide-slate-800/60">
                {tableData.length === 0 ? (
                  <tr>
                    <td colSpan={tableColumns.length} className="px-4 py-6 text-center text-muted-foreground">
                      No rows available.
                    </td>
                  </tr>
                ) : (
                  tableData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {tableColumns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-3.5 py-2.5 text-foreground/90 font-medium whitespace-nowrap',
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                            col.className
                          )}
                        >
                          {col.render ? col.render(row) : (row as any)[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="w-full flex-1 min-h-[220px] flex items-center justify-center">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
