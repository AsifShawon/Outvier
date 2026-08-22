'use client';

import * as React from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Calendar,
  Filter,
  RefreshCw,
  X,
  Building2,
  MapPin,
  Database,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DashboardFilterBarProps {
  isLoading?: boolean;
  onRefresh: () => void;
}

const DATE_PRESETS = [
  { label: '7 Days', value: '7d', days: 7 },
  { label: '30 Days', value: '30d', days: 30 },
  { label: '90 Days', value: '90d', days: 90 },
  { label: '1 Year', value: '1y', days: 365 },
];

const STATES = [
  { label: 'All States', value: 'all' },
  { label: 'NSW (New South Wales)', value: 'NSW' },
  { label: 'VIC (Victoria)', value: 'VIC' },
  { label: 'QLD (Queensland)', value: 'QLD' },
  { label: 'WA (Western Australia)', value: 'WA' },
  { label: 'SA (South Australia)', value: 'SA' },
  { label: 'TAS (Tasmania)', value: 'TAS' },
  { label: 'ACT (Australian Capital)', value: 'ACT' },
  { label: 'NT (Northern Territory)', value: 'NT' },
];

const SOURCES = [
  { label: 'All Sources', value: 'all' },
  { label: 'CRICOS API / CKAN', value: 'cricos_api' },
  { label: 'AI Ingestion', value: 'ai_ingestion' },
  { label: 'Manual CSV', value: 'csv' },
  { label: 'Manual Admin', value: 'manual' },
  { label: 'Connector Feed', value: 'connector' },
];

export function DashboardFilterBar({
  isLoading = false,
  onRefresh,
}: DashboardFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read current params from URL
  const currentRange = searchParams.get('range') || '30d';
  const currentState = searchParams.get('state') || 'all';
  const currentSource = searchParams.get('source') || 'all';
  const currentProvider = searchParams.get('provider') || '';
  const currentCompare = searchParams.get('compare') || 'previous_period';

  const [providerInput, setProviderInput] = React.useState(currentProvider);

  // Sync state if URL changes externally
  React.useEffect(() => {
    setProviderInput(currentProvider);
  }, [currentProvider]);

  const updateParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    // Auto-calculate from/to dates when preset range changes
    if (key === 'range') {
      const preset = DATE_PRESETS.find((p) => p.value === value);
      if (preset) {
        const to = new Date();
        const from = new Date(to.getTime() - preset.days * 24 * 60 * 60 * 1000);
        params.set('from', from.toISOString().split('T')[0]);
        params.set('to', to.toISOString().split('T')[0]);
      }
    }

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleProviderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('provider', providerInput.trim() || null);
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    params.set('range', '30d');
    const to = new Date();
    const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
    params.set('from', from.toISOString().split('T')[0]);
    params.set('to', to.toISOString().split('T')[0]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setProviderInput('');
  };

  const hasActiveFilters =
    currentState !== 'all' ||
    currentSource !== 'all' ||
    currentProvider !== '' ||
    currentRange !== '30d';

  return (
    <div className="bg-card/90 dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Top Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Date Range Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-elevated dark:bg-slate-900/70 p-1 rounded-xl border border-border/60 dark:border-slate-800">
          <Calendar className="h-4 w-4 ml-2 mr-1 text-purple-400 shrink-0" />
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => updateParam('range', preset.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                currentRange === preset.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Dropdowns: State, Source, Compare & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* State Filter */}
          <div className="w-[140px] sm:w-[160px]">
            <Select
              value={currentState}
              onValueChange={(val) => updateParam('state', val)}
            >
              <SelectTrigger className="h-9 text-xs bg-surface dark:bg-slate-900 border-border/60 dark:border-slate-800 rounded-xl">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-teal-400 shrink-0" />
                <SelectValue placeholder="State" />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-slate-900 border-border dark:border-slate-800 text-xs">
                {STATES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="w-[140px] sm:w-[160px]">
            <Select
              value={currentSource}
              onValueChange={(val) => updateParam('source', val)}
            >
              <SelectTrigger className="h-9 text-xs bg-surface dark:bg-slate-900 border-border/60 dark:border-slate-800 rounded-xl">
                <Database className="h-3.5 w-3.5 mr-1.5 text-purple-400 shrink-0" />
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent className="bg-popover dark:bg-slate-900 border-border dark:border-slate-800 text-xs">
                {SOURCES.map((src) => (
                  <SelectItem key={src.value} value={src.value} className="text-xs">
                    {src.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Search */}
          <form onSubmit={handleProviderSubmit} className="flex items-center gap-1.5">
            <div className="relative w-[150px] sm:w-[180px]">
              <Input
                type="text"
                placeholder="Filter provider..."
                value={providerInput}
                onChange={(e) => setProviderInput(e.target.value)}
                className="h-9 text-xs pl-8 bg-surface dark:bg-slate-900 border-border/60 dark:border-slate-800 rounded-xl"
              />
              <Building2 className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
            {providerInput !== currentProvider && (
              <Button type="submit" size="sm" variant="secondary" className="h-9 px-2.5 text-xs rounded-xl">
                <Check className="h-3.5 w-3.5" />
              </Button>
            )}
          </form>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3 text-xs bg-surface dark:bg-slate-900 border-border/60 dark:border-slate-800 rounded-xl hover:bg-muted/50"
            aria-label="Refresh dashboard data"
          >
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', isLoading && 'animate-spin text-purple-400')} />
            Refresh
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-9 px-2.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 dark:border-slate-800/40 text-xs">
          <span className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Active Filters:
          </span>
          {currentRange !== '30d' && (
            <Badge variant="outline" className="text-[11px] bg-purple-500/10 text-purple-300 border-purple-500/30 gap-1 rounded-md">
              Range: {DATE_PRESETS.find((p) => p.value === currentRange)?.label || currentRange}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateParam('range', '30d')} />
            </Badge>
          )}
          {currentState !== 'all' && (
            <Badge variant="outline" className="text-[11px] bg-teal-500/10 text-teal-300 border-teal-500/30 gap-1 rounded-md">
              State: {currentState}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateParam('state', 'all')} />
            </Badge>
          )}
          {currentSource !== 'all' && (
            <Badge variant="outline" className="text-[11px] bg-blue-500/10 text-blue-300 border-blue-500/30 gap-1 rounded-md">
              Source: {currentSource}
              <X className="h-3 w-3 cursor-pointer" onClick={() => updateParam('source', 'all')} />
            </Badge>
          )}
          {currentProvider && (
            <Badge variant="outline" className="text-[11px] bg-amber-500/10 text-amber-300 border-amber-500/30 gap-1 rounded-md">
              Provider: {currentProvider}
              <X className="h-3 w-3 cursor-pointer" onClick={() => { setProviderInput(''); updateParam('provider', null); }} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
