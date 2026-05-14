'use client';

import { useState } from 'react';
import { ApplicationTrackerItem } from '@/lib/api/applicationTracker.api';
import {
  GraduationCap,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  Award,
  Plane,
  Wrench,
  CheckCircle2,
  ChevronRight,
  Archive,
  ArrowRight,
} from 'lucide-react';
import { format, differenceInDays, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TrackerCardProps {
  item: ApplicationTrackerItem;
  onClick: (item: ApplicationTrackerItem) => void;
  onMoveNext?: (item: ApplicationTrackerItem) => void;
  onArchive?: (item: ApplicationTrackerItem) => void;
  nextColumnName?: string;
  disabled?: boolean;
}

const TYPE_CONFIG = {
  university: { icon: GraduationCap, color: 'bg-blue-50 text-blue-600', label: 'Uni', border: 'border-blue-100' },
  program:    { icon: GraduationCap, color: 'bg-violet-50 text-violet-600', label: 'Program', border: 'border-violet-100' },
  scholarship:{ icon: Award,         color: 'bg-amber-50 text-amber-600',  label: 'Scholarship', border: 'border-amber-100' },
  visa:       { icon: Plane,         color: 'bg-sky-50 text-sky-600',      label: 'Visa', border: 'border-sky-100' },
  custom:     { icon: Wrench,        color: 'bg-slate-50 text-slate-500',  label: 'Custom', border: 'border-slate-100' },
};

export function TrackerCard({ item, onClick, onMoveNext, onArchive, nextColumnName, disabled }: TrackerCardProps) {
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const typeConfig = TYPE_CONFIG[item.itemType] || TYPE_CONFIG.custom;
  const TypeIcon = typeConfig.icon;

  // Document progress
  const completedDocs = item.documentChecklist?.filter(
    d => ['completed', 'verified', 'uploaded', 'submitted'].includes(d.status)
  ).length ?? 0;
  const totalDocs = item.documentChecklist?.length ?? 0;

  // Task progress
  const completedTasks = item.tasks?.filter(t => t.completed).length ?? 0;
  const totalTasks = item.tasks?.length ?? 0;
  const totalDone = completedDocs + completedTasks;
  const totalAll = totalDocs + totalTasks;
  const overallPct = totalAll > 0 ? Math.round((totalDone / totalAll) * 100) : -1;

  // Deadline
  const now = new Date();
  const deadlineDate = item.deadline ? new Date(item.deadline) : null;
  const daysLeft = deadlineDate ? differenceInDays(deadlineDate, now) : null;
  const isOverdue  = !!deadlineDate && isBefore(deadlineDate, now) && !item.archived;
  const isUrgent   = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isWarning  = daysLeft !== null && daysLeft > 7 && daysLeft <= 30;

  const deadlineBg = isOverdue ? 'bg-red-500 text-white'
    : isUrgent   ? 'bg-orange-500 text-white'
    : isWarning  ? 'bg-amber-100 text-amber-700'
    : 'bg-slate-100 text-slate-500';

  const deadlineLabel = isOverdue         ? `Overdue · ${format(deadlineDate!, 'MMM d')}`
    : daysLeft === 0                      ? '⚠ Due today'
    : daysLeft === 1                      ? '1 day left'
    : daysLeft !== null && daysLeft <= 7  ? `${daysLeft}d left`
    : daysLeft !== null && daysLeft <= 30 ? `${daysLeft}d · ${format(deadlineDate!, 'MMM d')}`
    : deadlineDate                        ? format(deadlineDate, 'MMM d, yyyy')
    : null;

  // Next pending item for the "next action" hint
  const nextAction =
    item.documentChecklist?.find(d => d.status === 'pending')?.name ??
    item.tasks?.find(t => !t.completed)?.title;

  // Priority bar color
  const priorityBar =
    item.priority === 'high'   ? 'bg-red-400' :
    item.priority === 'medium' ? 'bg-amber-400' : 'bg-slate-200';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative rounded-2xl border bg-white shadow-sm cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-all duration-200 overflow-hidden select-none',
        isOverdue && 'border-red-200',
        isUrgent && !isOverdue && 'border-orange-200',
        isDragging && 'opacity-40 scale-[1.02] shadow-2xl ring-2 ring-primary/30 cursor-grabbing',
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      onClick={e => { if (!isDragging) onClick(item); }}
    >
      {/* Left priority bar */}
      <div className={cn('absolute inset-y-0 left-0 w-[3px] rounded-l-2xl', priorityBar)} />

      <div className="pl-3.5 pr-3 pt-2.5 pb-2.5 space-y-2">

        {/* Row 1: Type badge + urgency icon */}
        <div className="flex items-center justify-between gap-1">
          <span className={cn(
            'inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border',
            typeConfig.color, typeConfig.border,
          )}>
            <TypeIcon className="h-2.5 w-2.5" />
            {typeConfig.label}
          </span>

          <div className="flex items-center gap-1">
            {/* Country chip */}
            {item.country && (
              <span className="text-[9px] font-semibold text-slate-400 truncate max-w-[60px]">
                {item.country}
              </span>
            )}
            {/* Urgency icon */}
            {(isOverdue || isUrgent) && (
              <AlertTriangle className={cn('h-3 w-3 shrink-0', isOverdue ? 'text-red-500' : 'text-orange-500')} />
            )}
          </div>
        </div>

        {/* Row 2: Title */}
        <div>
          <h4 className={cn(
            'font-bold text-[13px] leading-snug line-clamp-2 transition-colors',
            isOverdue ? 'text-red-700' : 'text-slate-900 group-hover:text-primary',
          )}>
            {item.title}
          </h4>
          {item.subtitle && (
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{item.subtitle}</p>
          )}
        </div>

        {/* Row 3: Deadline pill — only when deadline exists, always visible */}
        {deadlineLabel && (
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full',
            deadlineBg,
          )}>
            <Calendar className="h-2.5 w-2.5" />
            {deadlineLabel}
          </span>
        )}

        {/* Row 4: Intake */}
        {item.intake && !deadlineLabel && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            <Clock className="h-2.5 w-2.5" />
            {item.intake}
          </span>
        )}

        {/* Row 5: Doc progress bar — only when docs exist */}
        {totalDocs > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
              <span className="flex items-center gap-1">
                <FileText className="h-2.5 w-2.5" />
                {completedDocs}/{totalDocs} docs
                {totalTasks > 0 && ` · ${completedTasks}/${totalTasks} tasks`}
              </span>
              {overallPct >= 0 && (
                <span className={overallPct === 100 ? 'text-green-600' : ''}>{overallPct}%</span>
              )}
            </div>
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  overallPct === 100 ? 'bg-green-500' : isUrgent || isOverdue ? 'bg-orange-400' : 'bg-primary'
                )}
                style={{ width: `${Math.max(overallPct, 0)}%` }}
              />
            </div>
          </div>
        )}

        {/* Row 6: Next action hint */}
        {nextAction && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium truncate">
            <CheckCircle2 className="h-2.5 w-2.5 shrink-0 text-slate-300" />
            <span className="truncate">{nextAction}</span>
          </div>
        )}

        {/* Quick action bar — slides in on hover (desktop) / always on mobile */}
        <div className={cn(
          'flex items-center gap-1 pt-1.5 border-t border-slate-100 transition-all duration-150',
          'lg:opacity-0 lg:translate-y-1 group-hover:opacity-100 group-hover:translate-y-0',
        )}
          onClick={e => e.stopPropagation()}
        >
          {/* Move to next stage */}
          {nextColumnName && onMoveNext && (
            <button
              onClick={() => onMoveNext(item)}
              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold text-primary bg-primary/8 hover:bg-primary/15 rounded-lg py-1 transition-colors"
            >
              <ArrowRight className="h-3 w-3" />
              {nextColumnName}
            </button>
          )}
          {/* Archive */}
          {onArchive && (
            <button
              onClick={() => onArchive(item)}
              className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
              title="Archive"
            >
              <Archive className="h-3 w-3" />
            </button>
          )}
          {/* Open detail */}
          <button
            onClick={() => onClick(item)}
            className="flex items-center justify-center w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Open details"
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
