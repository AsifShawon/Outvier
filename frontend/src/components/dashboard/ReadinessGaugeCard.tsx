'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Languages,
  Sliders,
  Target,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ProfileReadinessData } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface ReadinessGaugeCardProps {
  readiness?: ProfileReadinessData;
  overallPercentage?: number;
  isLoading?: boolean;
}

export function ReadinessGaugeCard({
  readiness,
  overallPercentage = 0,
  isLoading = false,
}: ReadinessGaugeCardProps) {
  const score = overallPercentage || readiness?.score || 0;
  const categories = readiness?.categoryScores;

  const domainList = [
    { label: 'Academics (GPA & Degree)', value: categories?.academics ?? 0, weight: '30%', icon: GraduationCap },
    { label: 'English Proficiency Test', value: categories?.english ?? 0, weight: '25%', icon: Languages },
    { label: 'Study & State Preferences', value: categories?.preferences ?? 0, weight: '20%', icon: Sliders },
    { label: 'Personal & Residence Data', value: categories?.personal ?? 0, weight: '15%', icon: BookOpen },
    { label: 'Target Career Goals', value: categories?.goals ?? 0, weight: '10%', icon: Target },
  ];

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full hover:border-primary/40 transition-colors">
      <CardContent className="p-0 space-y-4">
        {/* Title & Help Dialog */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Application Readiness
          </span>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground/70 hover:text-foreground text-xs inline-flex items-center gap-1 transition-colors focus:outline-none"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="text-[11px] underline underline-offset-2">How it works</span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold font-display text-foreground">
                  How Readiness is Calculated
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Your score reflects the completeness of your academic background and verified requirements needed for Australian admissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2 text-xs">
                {domainList.map((d) => (
                  <div key={d.label} className="flex items-center justify-between p-2.5 rounded-xl bg-surface-elevated dark:bg-slate-800/60">
                    <div className="flex items-center gap-2">
                      <d.icon className="h-4 w-4 text-purple-400" />
                      <span className="font-medium text-foreground">{d.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{d.value}%</span>
                      <span className="text-[10px] text-muted-foreground ml-1">({d.weight})</span>
                    </div>
                  </div>
                ))}
                <p className="text-[11px] text-muted-foreground italic pt-2">
                  Completing all categories ensures accurate admission eligibility checks and removes application bottlenecks.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Gauge & Main Percentage */}
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
                {score}%
              </span>
              <span className="text-xs font-semibold text-muted-foreground">Complete</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {readiness?.explanation || 'Keep adding your details to unlock eligibility.'}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <Progress
            value={score}
            className="h-2.5 bg-slate-800/40 rounded-full"
          />
        </div>

        {/* Action button */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-between text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 h-8"
          >
            <Link href="/dashboard/profile">
              <span>{score >= 90 ? 'View Full Profile' : 'Complete Remaining Fields'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
