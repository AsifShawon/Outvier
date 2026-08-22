import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters,
  actions,
  className,
}: FilterBarProps) {
  return (
    <div className={cn('flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-surface border border-border rounded-2xl mb-6 shadow-sm', className)}>
      {/* Search Input */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            value={searchValue || ''}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 h-10 bg-surface-elevated border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary rounded-xl text-xs"
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {/* Filters and Actions */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {filters}
        {actions}
      </div>
    </div>
  );
}
