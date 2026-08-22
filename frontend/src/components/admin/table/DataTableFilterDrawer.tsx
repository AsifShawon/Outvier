'use client';

import * as React from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface DataTableFilterDrawerProps {
  children: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
}

export function DataTableFilterDrawer({
  children,
  activeFilterCount = 0,
  onResetFilters,
}: DataTableFilterDrawerProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-xl bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 text-foreground md:hidden flex items-center gap-1.5"
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl p-6">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/60 dark:border-slate-800">
          <DialogTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Filter className="h-4 w-4 text-purple-400" />
            <span>Filter Records</span>
          </DialogTitle>
          {onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="text-xs text-rose-400 hover:text-rose-300 h-7 px-2 gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </DialogHeader>

        <div className="space-y-4 py-3 flex flex-col">{children}</div>

        <div className="pt-3 border-t border-border/60 dark:border-slate-800">
          <Button
            className="w-full text-xs font-semibold rounded-xl"
            onClick={() => setOpen(false)}
          >
            Apply & View Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
