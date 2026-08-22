'use client';

import * as React from 'react';
import { Check, PlusCircle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
}

interface DataTableFacetedFilterProps {
  title: string;
  options: FilterOption[];
  value?: string;
  onSelect: (value: string | undefined) => void;
  className?: string;
}

export function DataTableFacetedFilter({
  title,
  options,
  value,
  onSelect,
  className,
}: DataTableFacetedFilterProps) {
  const selectedOption = options.find((opt) => opt.value === value);
  const isFiltered = value && value !== 'all';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 text-xs border-dashed rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 text-foreground',
            isFiltered && 'border-solid border-purple-500/60 bg-purple-500/10 text-purple-300 font-semibold',
            className
          )}
        >
          <Filter className="mr-1.5 h-3.5 w-3.5" />
          <span>{title}</span>
          {isFiltered && selectedOption && (
            <>
              <div className="mx-1.5 h-3.5 w-px bg-border dark:bg-slate-700" />
              <Badge
                variant="secondary"
                className="rounded-md px-1.5 py-0 text-[10px] bg-purple-500/20 text-purple-200 border-none font-semibold"
              >
                {selectedOption.label}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-card dark:bg-slate-900 border-border dark:border-slate-800 text-xs p-1">
        <DropdownMenuLabel className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Filter by {title}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border/60 dark:bg-slate-800" />

        {options.map((option) => {
          const isSelected = value === option.value || (!value && option.value === 'all');
          return (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSelect(option.value === 'all' ? undefined : option.value)}
              className="cursor-pointer flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-800/60"
            >
              <div className="flex items-center gap-2">
                {option.icon && <option.icon className="h-3.5 w-3.5 text-muted-foreground" />}
                <span className={cn(isSelected && 'font-bold text-foreground')}>{option.label}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-purple-400" />}
              {option.count !== undefined && (
                <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                  {option.count}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}

        {isFiltered && (
          <>
            <DropdownMenuSeparator className="bg-border/60 dark:bg-slate-800" />
            <DropdownMenuItem
              onClick={() => onSelect(undefined)}
              className="cursor-pointer justify-center text-center font-semibold text-rose-400 hover:text-rose-300 py-1.5"
            >
              Clear filter
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
