'use client';

import * as React from 'react';
import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  onSort?: (columnId: string, order?: 'asc' | 'desc') => void;
  currentSortBy?: string;
  currentSortOrder?: 'asc' | 'desc';
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  onSort,
  currentSortBy,
  currentSortOrder,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn('text-xs font-semibold text-muted-foreground', className)}>{title}</div>;
  }

  const columnId = column.id;
  const isSorted = currentSortBy === columnId;
  const isAsc = isSorted && currentSortOrder === 'asc';
  const isDesc = isSorted && currentSortOrder === 'desc';

  const handleSortAsc = () => {
    if (onSort) onSort(columnId, 'asc');
    else column.toggleSorting(false);
  };

  const handleSortDesc = () => {
    if (onSort) onSort(columnId, 'desc');
    else column.toggleSorting(true);
  };

  const handleToggle = () => {
    if (onSort) {
      if (isAsc) onSort(columnId, 'desc');
      else if (isDesc) onSort(columnId, 'asc');
      else onSort(columnId, 'asc');
    } else {
      column.toggleSorting(column.getIsSorted() === 'asc');
    }
  };

  return (
    <div className={cn('flex items-center space-x-1', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 text-xs font-semibold data-[state=open]:bg-accent hover:bg-slate-800/40"
          >
            <span>{title}</span>
            {isDesc ? (
              <ArrowDown className="ml-1.5 h-3.5 w-3.5 text-purple-400" />
            ) : isAsc ? (
              <ArrowUp className="ml-1.5 h-3.5 w-3.5 text-purple-400" />
            ) : (
              <ChevronsUpDown className="ml-1.5 h-3.5 w-3.5 text-muted-foreground/60" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-card dark:bg-slate-900 border-border dark:border-slate-800 text-xs">
          <DropdownMenuItem onClick={handleSortAsc} className="cursor-pointer">
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Ascending
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSortDesc} className="cursor-pointer">
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Descending
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator className="bg-border/60 dark:bg-slate-800" />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)} className="cursor-pointer">
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Hide Column
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
