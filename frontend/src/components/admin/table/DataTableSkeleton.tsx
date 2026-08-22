'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
}

export function DataTableSkeleton({
  columnCount = 6,
  rowCount = 8,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-4">
      {/* Table Skeleton */}
      <div className="rounded-2xl border border-border/80 dark:border-slate-800/80 overflow-hidden bg-card dark:bg-[#121929]">
        <Table>
          <TableHeader className="bg-muted/40 dark:bg-slate-900/80 border-b border-border/60 dark:border-slate-800">
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i} className="h-10 px-4">
                  <Skeleton className="h-4 w-20 rounded-md" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, r) => (
              <TableRow key={r} className="border-b border-border/40 dark:border-slate-800/60 h-12">
                {Array.from({ length: columnCount }).map((_, c) => (
                  <TableCell key={c} className="px-4">
                    <Skeleton
                      className={`h-4 rounded-md ${
                        c === 0 ? 'w-28' : c === 1 ? 'w-40' : c === columnCount - 1 ? 'w-16' : 'w-24'
                      }`}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
