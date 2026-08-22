'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTablePaginationProps {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  pageSizeOptions?: number[];
  isPending?: boolean;
}

export function DataTablePagination({
  page,
  limit,
  total,
  onPageChange,
  onLimitChange,
  pageSizeOptions = [10, 20, 50, 100],
  isPending = false,
}: DataTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border-t border-border/60 dark:border-slate-800/80 text-xs text-muted-foreground">
      {/* Showing count */}
      <div className="flex items-center gap-1.5 order-2 sm:order-1">
        <span>
          Showing <span className="font-semibold text-foreground">{from}</span> to{' '}
          <span className="font-semibold text-foreground">{to}</span> of{' '}
          <span className="font-semibold text-foreground">{total}</span> entries
        </span>
      </div>

      {/* Page size & Controls */}
      <div className="flex items-center gap-4 sm:gap-6 order-1 sm:order-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Rows per page:</span>
          <Select
            value={String(limit)}
            onValueChange={(val) => onLimitChange(parseInt(val, 10))}
            disabled={isPending}
          >
            <SelectTrigger className="h-8 w-[70px] text-xs rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800">
              <SelectValue placeholder={String(limit)} />
            </SelectTrigger>
            <SelectContent side="top" className="bg-card dark:bg-slate-900 border-border dark:border-slate-800 text-xs">
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs cursor-pointer">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-2 font-medium whitespace-nowrap">
            Page <span className="text-foreground font-bold">{page}</span> of{' '}
            <span className="text-foreground font-bold">{totalPages}</span>
          </span>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 disabled:opacity-40"
            onClick={() => onPageChange(1)}
            disabled={page <= 1 || isPending}
            title="First page"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 disabled:opacity-40"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || isPending}
            title="Previous page"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 disabled:opacity-40"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || isPending}
            title="Next page"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 disabled:opacity-40"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || isPending}
            title="Last page"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
