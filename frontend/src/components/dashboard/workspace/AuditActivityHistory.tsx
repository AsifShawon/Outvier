'use client';

import { StatusEventRecord } from '@/lib/api/applicationWorkspace.api';
import { Badge } from '@/components/ui/badge';
import { History, ArrowRight, UserCheck, ShieldCheck, Bot, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditActivityHistoryProps {
  events: StatusEventRecord[];
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  'student-reported': { label: 'Student-Reported', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
  'staff-verified': { label: 'Staff-Verified', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  'provider-confirmed': { label: 'Provider-Confirmed', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30' },
  'integration-confirmed': { label: 'Verified Integration', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
};

export function AuditActivityHistory({ events = [] }: AuditActivityHistoryProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Auditable Activity & Status History
        </h3>
        <span className="text-[11px] text-muted-foreground font-mono">
          {events.length} Event(s) Logged
        </span>
      </div>

      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground italic p-4 bg-muted/20 rounded-xl text-center">
          No activity recorded yet.
        </p>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {events.map((ev, i) => {
            const sourceBadge = SOURCE_BADGES[ev.toStatusSource] || SOURCE_BADGES['student-reported'];
            const actorName =
              ev.actorName ||
              (typeof ev.changedBy === 'object' && ev.changedBy ? ev.changedBy.name || ev.changedBy.username : 'User');
            const actorRole = ev.changedByRole || 'user';

            return (
              <div key={ev._id || i} className="relative group text-xs space-y-1.5">
                {/* Timeline Dot */}
                <div className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary ring-2 ring-primary/20" />

                {/* Transition Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground capitalize">
                      {ev.fromStage?.replace(/_/g, ' ') || 'Initial'}
                    </span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge variant="outline" className="font-bold capitalize bg-primary/10 text-primary border-primary/30">
                      {ev.toStage?.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className={cn('text-[10px] font-mono px-1.5 py-0', sourceBadge.color)}>
                      {sourceBadge.label}
                    </Badge>
                  </div>

                  <span className="text-[11px] text-muted-foreground font-mono">
                    {formatDistanceToNow(new Date(ev.createdAt), { addSuffix: true })}
                  </span>
                </div>

                {/* Actor & Reason */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground flex items-center gap-1">
                    {actorRole === 'admin' ? (
                      <ShieldCheck className="h-3 w-3 text-purple-500" />
                    ) : actorRole === 'integration' ? (
                      <Bot className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <UserCheck className="h-3 w-3 text-primary" />
                    )}
                    {actorName} ({actorRole})
                  </span>
                  {ev.reason && <span>· {ev.reason}</span>}
                </div>

                {ev.notes && (
                  <p className="p-2.5 rounded-lg bg-background border border-border text-[11px] text-foreground leading-relaxed mt-1">
                    {ev.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
