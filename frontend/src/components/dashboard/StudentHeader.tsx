'use client';

import * as React from 'react';
import Link from 'next/link';
import { Sparkles, Calendar, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NextActionData } from '@/types/studentDashboard';

export interface StudentHeaderProps {
  studentName?: string;
  intakeGoal?: string;
  primaryAction?: NextActionData;
  isLoading?: boolean;
}

export function StudentHeader({
  studentName = 'Student',
  intakeGoal = 'Feb 2027 Intake',
  primaryAction,
  isLoading = false,
}: StudentHeaderProps) {
  return (
    <div className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: Greeting & Goal */}
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
              Welcome back, {studentName}
            </h1>
            <Badge
              variant="outline"
              className="bg-purple-500/10 text-purple-400 dark:text-purple-300 border-purple-500/20 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1.5"
            >
              <Calendar className="h-3 w-3" />
              <span>Target: {intakeGoal}</span>
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Here is your live application readiness snapshot. Take your next step to keep your Australian study journey on track.
          </p>
        </div>

        {/* Right: One Clear Primary Action */}
        {primaryAction && (
          <div className="shrink-0 flex items-center gap-3">
            <Button
              size="lg"
              asChild
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-2xl shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
            >
              <Link href={primaryAction.actionUrl} className="flex items-center justify-center gap-2">
                <span>{primaryAction.buttonLabel}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
