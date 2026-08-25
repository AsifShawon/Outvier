'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { applicationWorkspaceApi, ApplicationWorkspaceItem } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  differenceInDays,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface ApplicationCalendarViewProps {
  onSelectApplication: (id: string) => void;
}

export function ApplicationCalendarView({ onSelectApplication }: ApplicationCalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: res, isLoading } = useQuery({
    queryKey: ['workspace-applications-calendar'],
    queryFn: () => applicationWorkspaceApi.getApplications({ limit: 100 }),
  });

  const applications = res?.data?.data || [];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Group applications and task deadlines by day string
  const eventsByDay: Record<string, { app: ApplicationWorkspaceItem; type: 'app' | 'task'; title: string }[]> = {};

  applications.forEach((app) => {
    if (app.deadline) {
      const dayKey = format(new Date(app.deadline), 'yyyy-MM-dd');
      if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
      eventsByDay[dayKey].push({
        app,
        type: 'app',
        title: `${app.programChoice?.customProgramName || app.title} Deadline`,
      });
    }

    (app.tasks || []).forEach((t) => {
      if (t.dueDate) {
        const dayKey = format(new Date(t.dueDate), 'yyyy-MM-dd');
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
        eventsByDay[dayKey].push({
          app,
          type: 'task',
          title: t.title,
        });
      }
    });
  });

  // Collect upcoming deadlines across all applications
  const upcomingDeadlines: { app: ApplicationWorkspaceItem; date: Date; title: string; daysLeft: number; isOverdue: boolean }[] = [];
  const now = new Date();

  applications.forEach((app) => {
    if (app.deadline) {
      const d = new Date(app.deadline);
      const daysLeft = differenceInDays(d, now);
      upcomingDeadlines.push({
        app,
        date: d,
        title: `${app.programChoice?.customProgramName || app.title} (Application Deadline)`,
        daysLeft,
        isOverdue: isBefore(d, now) && !app.archived,
      });
    }
  });

  upcomingDeadlines.sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Calendar Grid (8 cols) */}
      <div className="lg:col-span-8 rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
        {/* Month Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <h3 className="text-base font-bold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((prev) => subMonths(prev, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
              className="h-8 text-xs px-2.5"
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth((prev) => addMonths(prev, 1))}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-wider py-1 border-b border-border">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDay[dayKey] || [];
            const isToday = isSameDay(day, new Date());
            const isCurrMonth = isSameMonth(day, currentMonth);

            return (
              <div
                key={i}
                className={cn(
                  'min-h-[85px] p-1.5 rounded-xl border flex flex-col justify-between transition-colors',
                  isCurrMonth ? 'bg-background border-border/70' : 'bg-muted/20 border-transparent opacity-40',
                  isToday && 'border-primary ring-1 ring-primary/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      'text-xs font-semibold h-5 w-5 rounded-full flex items-center justify-center',
                      isToday ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>

                {/* Day Event Badges */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayEvents.slice(0, 2).map((ev, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectApplication(ev.app._id)}
                      className={cn(
                        'w-full text-left p-1 rounded-md text-[9px] font-semibold truncate block cursor-pointer transition-all',
                        ev.type === 'app'
                          ? 'bg-primary/10 text-primary hover:bg-primary/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20'
                      )}
                    >
                      {ev.title}
                    </button>
                  ))}
                  {dayEvents.length > 2 && (
                    <span className="text-[8px] text-muted-foreground font-mono block text-center">
                      +{dayEvents.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Milestones Sidebar (4 cols) */}
      <div className="lg:col-span-4 rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Upcoming Deadlines
          </h3>
          <span className="text-[11px] text-muted-foreground font-mono">
            {upcomingDeadlines.length} Total
          </span>
        </div>

        {upcomingDeadlines.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded-xl text-center">
            No application deadlines scheduled.
          </p>
        ) : (
          <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
            {upcomingDeadlines.map((item, i) => (
              <div
                key={i}
                onClick={() => onSelectApplication(item.app._id)}
                className={cn(
                  'p-3 rounded-xl border text-xs space-y-1.5 cursor-pointer hover:border-primary/40 transition-all group',
                  item.isOverdue
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : item.daysLeft <= 7
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-background border-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {item.app.programChoice?.customProgramName || item.app.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[9px] font-bold font-mono',
                      item.isOverdue
                        ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/30'
                        : item.daysLeft <= 7
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.isOverdue
                      ? 'Overdue'
                      : item.daysLeft === 0
                      ? 'Due Today'
                      : `${item.daysLeft}d left`}
                  </Badge>
                </div>

                <p className="text-[11px] text-muted-foreground truncate">
                  {item.app.programChoice?.customUniversityName || item.app.subtitle || 'Institution'}
                </p>

                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono pt-1">
                  <CalendarIcon className="h-3 w-3" />
                  <span>{format(item.date, 'EEEE, MMM d, yyyy')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
