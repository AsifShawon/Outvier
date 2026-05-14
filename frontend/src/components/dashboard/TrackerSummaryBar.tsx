'use client';

import { ApplicationTrackerItem } from '@/lib/api/applicationTracker.api';
import {
  ClipboardList,
  Calendar,
  FileText,
  TrendingUp,
  Archive,
  AlertTriangle,
} from 'lucide-react';
import { isBefore, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrackerSummaryBarProps {
  items: ApplicationTrackerItem[];
  onFilterChange?: (filter: any) => void;
}

export function TrackerSummaryBar({ items, onFilterChange }: TrackerSummaryBarProps) {
  const now = new Date();
  const soon = addDays(now, 30);

  const activeItems = items.filter(i => !i.archived);
  const archivedItems = items.filter(i => i.archived);
  const upcomingDeadlines = activeItems.filter(i =>
    i.deadline && isBefore(new Date(i.deadline), soon) && !isBefore(new Date(i.deadline), now)
  );
  const overdueItems = activeItems.filter(i =>
    i.deadline && isBefore(new Date(i.deadline), now)
  );
  const docsPending = activeItems.reduce((acc, item) => {
    return acc + (item.documentChecklist?.filter(d => d.status === 'pending').length || 0);
  }, 0);
  const offersCount = activeItems.filter(i => {
    // Items in offer-related stages — check by title heuristics
    return i.tags?.includes('offer') || i.tags?.includes('Offer');
  }).length;

  const stats = [
    {
      label: 'Active',
      value: activeItems.length,
      icon: ClipboardList,
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      onClick: () => onFilterChange?.({ archived: 'false' }),
    },
    {
      label: 'Deadlines Soon',
      value: upcomingDeadlines.length + overdueItems.length,
      icon: overdueItems.length > 0 ? AlertTriangle : Calendar,
      color: overdueItems.length > 0 ? 'text-red-600' : upcomingDeadlines.length > 0 ? 'text-amber-600' : 'text-slate-400',
      bg: overdueItems.length > 0 ? 'bg-red-50' : upcomingDeadlines.length > 0 ? 'bg-amber-50' : 'bg-slate-50',
      border: overdueItems.length > 0 ? 'border-red-200' : upcomingDeadlines.length > 0 ? 'border-amber-200' : 'border-slate-200',
      pulse: overdueItems.length > 0,
      onClick: () => onFilterChange?.({ archived: 'false', deadline: 'overdue' }),
    },
    {
      label: 'Docs Pending',
      value: docsPending,
      icon: FileText,
      color: docsPending > 0 ? 'text-blue-600' : 'text-slate-400',
      bg: docsPending > 0 ? 'bg-blue-50' : 'bg-slate-50',
      border: docsPending > 0 ? 'border-blue-200' : 'border-slate-200',
      onClick: undefined,
    },
    {
      label: 'Archived',
      value: archivedItems.length,
      icon: Archive,
      color: 'text-slate-400',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      onClick: () => onFilterChange?.({ archived: 'true' }),
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <button
            key={stat.label}
            onClick={stat.onClick}
            disabled={!stat.onClick}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all shrink-0',
              stat.bg, stat.border,
              stat.onClick ? 'hover:shadow-sm hover:scale-[1.02] cursor-pointer' : 'cursor-default',
            )}
          >
            <div className={cn('relative', stat.pulse && 'animate-pulse')}>
              <Icon className={cn('h-4 w-4', stat.color)} />
            </div>
            <div className="text-left">
              <p className={cn('text-base font-black leading-none', stat.color)}>{stat.value}</p>
              <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5 whitespace-nowrap">{stat.label}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
