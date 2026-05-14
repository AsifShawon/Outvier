'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrackerFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function TrackerFilters({ filters, onFilterChange, onClear }: TrackerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = !!(filters.search || filters.priority || filters.itemType || filters.deadline || filters.country);
  const activeCount = [filters.search, filters.priority, filters.itemType, filters.deadline, filters.country].filter(Boolean).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, country, or tag..."
            className="pl-10 rounded-xl border-slate-200 h-10 bg-white focus:ring-primary/20 text-sm"
            value={filters.search || ''}
            onChange={e => onFilterChange({ ...filters, search: e.target.value || undefined })}
          />
        </div>

        <Button
          variant={isExpanded ? 'secondary' : 'outline'}
          className={cn(
            'rounded-xl h-10 px-3 gap-2 border-slate-200 text-sm font-bold shrink-0',
            hasActiveFilters && 'border-primary/50 text-primary'
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeCount > 0 && (
            <Badge className="h-4 w-4 p-0 flex items-center justify-center bg-primary text-white rounded-full text-[9px] ml-0.5">
              {activeCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={onClear} className="rounded-xl h-10 px-3 text-slate-400 hover:text-destructive shrink-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={v => onFilterChange({ ...filters, priority: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-9 text-xs font-bold">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
                <SelectItem value="high" className="text-xs text-red-600">🔴 High</SelectItem>
                <SelectItem value="medium" className="text-xs text-amber-600">🟡 Medium</SelectItem>
                <SelectItem value="low" className="text-xs text-slate-500">⚪ Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Type</label>
            <Select
              value={filters.itemType || 'all'}
              onValueChange={v => onFilterChange({ ...filters, itemType: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-9 text-xs font-bold">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">All Types</SelectItem>
                <SelectItem value="program" className="text-xs">Program</SelectItem>
                <SelectItem value="university" className="text-xs">University</SelectItem>
                <SelectItem value="scholarship" className="text-xs">Scholarship</SelectItem>
                <SelectItem value="visa" className="text-xs">Visa</SelectItem>
                <SelectItem value="custom" className="text-xs">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country</label>
            <Input
              placeholder="e.g. Australia"
              value={filters.country || ''}
              onChange={e => onFilterChange({ ...filters, country: e.target.value || undefined })}
              className="rounded-xl border-slate-100 bg-slate-50 h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Deadline</label>
            <Select
              value={filters.deadline || 'all'}
              onValueChange={v => onFilterChange({ ...filters, deadline: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50 h-9 text-xs font-bold">
                <SelectValue placeholder="Any time" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs">Any Time</SelectItem>
                <SelectItem value="overdue" className="text-xs text-red-600">Overdue</SelectItem>
                <SelectItem value="this-month" className="text-xs">This Month</SelectItem>
                <SelectItem value="next-3-months" className="text-xs">Next 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 sm:col-span-4 pt-1 border-t border-slate-100 flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'rounded-xl text-xs font-bold h-8 gap-2',
                filters.archived === 'true' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700'
              )}
              onClick={() => onFilterChange({ ...filters, archived: filters.archived === 'true' ? 'false' : 'true' })}
            >
              {filters.archived === 'true' ? '✓ Showing Archived' : 'Show Archived'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
