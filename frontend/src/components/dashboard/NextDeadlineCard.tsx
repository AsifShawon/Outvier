'use client';

import * as React from 'react';
import Link from 'next/link';
import { Clock, Calendar, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpcomingDeadlineItem } from '@/types/studentDashboard';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export interface NextDeadlineCardProps {
  deadline?: UpcomingDeadlineItem;
  totalDeadlinesCount?: number;
  isLoading?: boolean;
}

export function NextDeadlineCard({
  deadline,
  totalDeadlinesCount = 0,
  isLoading = false,
}: NextDeadlineCardProps) {
  if (!deadline) {
    return (
      <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
        <CardContent className="p-0 space-y-3 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Upcoming Deadlines
              </span>
              <Calendar className="h-4 w-4 text-muted-foreground/60" />
            </div>
            <h3 className="text-base font-bold font-display text-foreground">
              No Approaching Deadlines
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add programs to your tracker to monitor intake cutoff dates.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full text-xs rounded-xl h-8 border-border/60"
          >
            <Link href="/programs">Explore Intake Deadlines</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const days = deadline.daysRemaining;
  const isUrgent = deadline.isUrgent;
  const isOverdue = deadline.isOverdue;

  let formattedDate = deadline.deadlineDate;
  try {
    formattedDate = format(parseISO(deadline.deadlineDate), 'MMM dd, yyyy');
  } catch {}

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full hover:border-amber-500/40 transition-colors">
      <CardContent className="p-0 space-y-3 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Nearest Deadline
            </span>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full',
                isOverdue
                  ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  : isUrgent
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
              )}
            >
              {isOverdue ? 'Overdue' : `${days} Days Left`}
            </Badge>
          </div>

          {/* Program & Provider */}
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold font-display text-foreground line-clamp-1">
              {deadline.title}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-1">
              {deadline.providerName} • {deadline.intake || 'Upcoming Intake'}
            </p>
          </div>

          {/* Date & Source verification signal */}
          <div className="mt-2 pt-2 border-t border-border/40 dark:border-slate-800/60 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Due Date:</span>
              <span className="font-bold text-foreground">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-teal-400">
              <ShieldCheck className="h-3 w-3 shrink-0" />
              <span className="truncate">{deadline.source}</span>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-between text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 h-8"
          >
            <Link href={deadline.actionUrl}>
              <span>Open Application Tracker</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
