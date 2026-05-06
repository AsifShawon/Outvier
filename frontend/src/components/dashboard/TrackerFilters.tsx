'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  X,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrackerFiltersProps {
  filters: any;
  onFilterChange: (filters: any) => void;
  onClear: () => void;
}

export function TrackerFilters({ filters, onFilterChange, onClear }: TrackerFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = filters.search || filters.priority || filters.itemType || filters.deadline;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search applications, universities..." 
            className="pl-10 rounded-xl border-slate-200 h-11 bg-white focus:ring-primary/20"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={isExpanded ? 'secondary' : 'outline'} 
            className={cn(
              "rounded-xl h-11 px-4 gap-2 border-slate-200",
              hasActiveFilters && "border-primary/50 text-primary"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Filter className="h-4 w-4" />
            Advanced Filters
            {hasActiveFilters && (
              <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-white rounded-full text-[10px]">
                !
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={onClear} className="rounded-xl h-11 px-4 text-slate-400 hover:text-destructive">
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Priority</label>
            <Select 
              value={filters.priority || 'all'} 
              onValueChange={(v) => onFilterChange({ ...filters, priority: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-10 text-xs font-bold">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="text-xs font-bold">All Priorities</SelectItem>
                <SelectItem value="high" className="text-xs font-bold text-red-600">High Priority</SelectItem>
                <SelectItem value="medium" className="text-xs font-bold text-amber-600">Medium Priority</SelectItem>
                <SelectItem value="low" className="text-xs font-bold text-slate-600">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Item Type</label>
            <Select 
              value={filters.itemType || 'all'} 
              onValueChange={(v) => onFilterChange({ ...filters, itemType: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-10 text-xs font-bold">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="text-xs font-bold">All Types</SelectItem>
                <SelectItem value="program" className="text-xs font-bold">Programs</SelectItem>
                <SelectItem value="university" className="text-xs font-bold">Universities</SelectItem>
                <SelectItem value="custom" className="text-xs font-bold">Custom Items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Deadline</label>
            <Select 
              value={filters.deadline || 'all'} 
              onValueChange={(v) => onFilterChange({ ...filters, deadline: v === 'all' ? undefined : v })}
            >
              <SelectTrigger className="rounded-xl border-slate-100 bg-slate-50/50 h-10 text-xs font-bold">
                <SelectValue placeholder="Any Time" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200">
                <SelectItem value="all" className="text-xs font-bold">Any Time</SelectItem>
                <SelectItem value="overdue" className="text-xs font-bold text-red-600">Overdue</SelectItem>
                <SelectItem value="this-month" className="text-xs font-bold">This Month</SelectItem>
                <SelectItem value="next-3-months" className="text-xs font-bold">Next 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Archive</label>
            <div className="flex items-center h-10">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "w-full rounded-xl text-xs font-bold h-9 gap-2",
                  filters.archived === 'true' ? "bg-slate-900 text-white" : "text-slate-400"
                )}
                onClick={() => onFilterChange({ ...filters, archived: filters.archived === 'true' ? 'false' : 'true' })}
              >
                {filters.archived === 'true' ? 'Showing Archived' : 'Show Archived'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
