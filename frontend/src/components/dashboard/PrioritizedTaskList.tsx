'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TasksSummaryData, ApplicationTaskItem } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface PrioritizedTaskListProps {
  tasksSummary?: TasksSummaryData;
  isLoading?: boolean;
}

export function PrioritizedTaskList({ tasksSummary, isLoading = false }: PrioritizedTaskListProps) {
  const tasks = tasksSummary?.tasks || [];
  const overdueCount = tasksSummary?.overdueCount || 0;

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden h-full flex flex-col justify-between">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-purple-400" />
            Actionable Checklist & Tasks
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {overdueCount > 0 ? (
              <span className="text-rose-400 font-semibold">{overdueCount} overdue item(s) requiring attention</span>
            ) : (
              'Prioritized milestones for your active applications'
            )}
          </CardDescription>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2">
          <Link href="/dashboard/tracker">
            <span>Manage All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {tasks.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <CheckCircle2 className="h-8 w-8 text-teal-400/60 mx-auto" />
            <p className="text-sm font-medium text-foreground">No Pending Tasks</p>
            <p className="text-xs text-muted-foreground">All application checklist items are complete.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40 dark:divide-slate-800/60">
            {tasks.slice(0, 5).map((task) => (
              <Link
                key={task.id}
                href={`/dashboard/tracker?item=${task.applicationId}`}
                className="p-4 sm:p-5 flex items-start justify-between gap-3 hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors group block"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    {task.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-teal-400" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </div>

                  <div className="space-y-0.5 min-w-0">
                    <p
                      className={cn(
                        'text-xs sm:text-sm font-semibold truncate transition-colors',
                        task.completed ? 'line-through text-muted-foreground' : 'text-foreground group-hover:text-primary'
                      )}
                    >
                      {task.title}
                    </p>
                    {task.programTitle && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {task.programTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {task.isOverdue ? (
                    <Badge variant="outline" className="text-[10px] bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold">
                      Overdue
                    </Badge>
                  ) : task.dueDate ? (
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {task.daysRemaining !== null ? `Due in ${task.daysRemaining}d` : 'Upcoming'}
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-surface-elevated text-muted-foreground">
                      {task.category || 'Task'}
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
