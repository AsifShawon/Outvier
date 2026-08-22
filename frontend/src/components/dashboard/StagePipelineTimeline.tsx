'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  Bookmark,
  FileCheck,
  Send,
  Award,
  Plane,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ApplicationStageCount } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface StagePipelineTimelineProps {
  stages?: ApplicationStageCount[];
  isLoading?: boolean;
}

export function StagePipelineTimeline({ stages = [], isLoading = false }: StagePipelineTimelineProps) {
  const router = useRouter();

  const getStageIcon = (key: string) => {
    switch (key) {
      case 'researching':
        return Compass;
      case 'shortlisted':
        return Bookmark;
      case 'preparing':
        return FileCheck;
      case 'applied':
        return Send;
      case 'offer':
        return Award;
      case 'onboarding':
        return Plane;
      default:
        return Compass;
    }
  };

  const totalApplications = stages.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold font-display text-foreground">
            Application Journey & Stage Overview
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Track your progress across university admission milestones
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2.5">
          <Link href="/dashboard/tracker">
            <span>Open Tracker Board</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {stages.map((stage, idx) => {
            const Icon = getStageIcon(stage.stageKey);
            const hasItems = stage.count > 0;

            return (
              <div
                key={stage.stageKey}
                onClick={() => router.push(`/dashboard/tracker?stage=${stage.stageKey}`)}
                className={cn(
                  'relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between space-y-3',
                  hasItems
                    ? 'bg-purple-500/5 dark:bg-slate-800/60 border-purple-500/30 hover:border-purple-500/60 shadow-xs'
                    : 'bg-muted/10 dark:bg-slate-900/30 border-border/40 hover:border-border/80 opacity-80'
                )}
              >
                <div className="flex items-start justify-between gap-1">
                  <div
                    className={cn(
                      'p-2 rounded-xl shrink-0',
                      hasItems ? 'bg-purple-500/20 text-purple-400' : 'bg-muted/30 text-muted-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span
                    className={cn(
                      'text-lg font-bold font-display',
                      hasItems ? 'text-foreground' : 'text-muted-foreground/60'
                    )}
                  >
                    {stage.count}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-foreground line-clamp-1">
                    {stage.stageName}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Step {idx + 1} of 6
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
