'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UpcomingDeadlineItem } from '@/types/studentDashboard';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export interface UpcomingDeadlinesListProps {
  deadlines?: UpcomingDeadlineItem[];
  isLoading?: boolean;
}

export function UpcomingDeadlinesList({
  deadlines = [],
  isLoading = false,
}: UpcomingDeadlinesListProps) {
  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-400" />
            Approaching Deadlines
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Official cutoff and intake milestones
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2">
          <Link href="/dashboard/tracker">
            <span>View All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {deadlines.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-sm font-medium text-foreground">No Upcoming Deadlines</p>
            <p className="text-xs text-muted-foreground">
              Add programs to your tracker to monitor intake dates.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 dark:divide-slate-800/60">
            {deadlines.slice(0, 5).map((dl) => {
              let formattedDate = dl.deadlineDate;
              try {
                formattedDate = format(parseISO(dl.deadlineDate), 'MMM dd, yyyy');
              } catch {}

              const isOverdue = dl.isOverdue;
              const isUrgent = dl.isUrgent;

              return (
                <Link
                  key={dl.id}
                  href={dl.actionUrl}
                  className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors group block"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {dl.title}
                      </p>
                    </div>

                    <p className="text-[11px] text-muted-foreground truncate">
                      {dl.providerName} • {dl.intake || 'Intake'}
                    </p>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formattedDate}
                      </span>
                      <span className="text-[10px] text-teal-400 flex items-center gap-0.5">
                        <ShieldCheck className="h-3 w-3" />
                        {dl.source}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap',
                        isOverdue
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : isUrgent
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                      )}
                    >
                      {isOverdue ? 'Overdue' : `${dl.daysRemaining} days left`}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
