'use client';

import * as React from 'react';
import { Table } from '@tanstack/react-table';
import { SlidersHorizontal, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnVisibilityProps<TData> {
  table: Table<TData>;
}

export function DataTableColumnVisibility<TData>({
  table,
}: DataTableColumnVisibilityProps<TData>) {
  const columns = table
    .getAllColumns()
    .filter((column) => typeof column.accessorFn !== 'undefined' && column.getCanHide());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 text-foreground ml-auto hidden sm:flex items-center gap-1.5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-card dark:bg-slate-900 border-border dark:border-slate-800 text-xs">
        <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          Toggle columns
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60 dark:bg-slate-800" />
        {columns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              className="capitalize cursor-pointer"
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(!!value)}
            >
              {column.id.replace(/([A-Z])/g, ' $1')}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
