'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Compass,
  Bookmark,
  DollarSign,
  CheckSquare,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface OnboardingEmptyStateProps {
  profileScore?: number;
  hasShortlist?: boolean;
}

export function OnboardingEmptyState({
  profileScore = 0,
  hasShortlist = false,
}: OnboardingEmptyStateProps) {
  const steps = [
    {
      step: '1',
      title: 'Complete Your Academic Profile',
      description: 'Enter your degree background, GPA scale, and English test status to unlock verified admission eligibility.',
      href: '/dashboard/profile',
      buttonLabel: 'Complete Profile',
      isComplete: profileScore >= 60,
      icon: Compass,
    },
    {
      step: '2',
      title: 'Explore & Shortlist Programs',
      description: 'Browse verified Australian universities and compare course fees, CRICOS requirements, and faculty rankings.',
      href: '/programs',
      buttonLabel: 'Explore Courses',
      isComplete: hasShortlist,
      icon: Bookmark,
    },
    {
      step: '3',
      title: 'Plan Your Cost & Budget Ceiling',
      description: 'Calculate indicative living expenses in Sydney, Melbourne, Brisbane, or regional states against tuition.',
      href: '/dashboard/budget',
      buttonLabel: 'Set Budget Plan',
      isComplete: false,
      icon: DollarSign,
    },
    {
      step: '4',
      title: 'Track Deadlines & Document Checklists',
      description: 'Monitor intake deadlines, prepare transcripts and statement of purpose (SOP), and track offers.',
      href: '/dashboard/tracker',
      buttonLabel: 'Open Application Tracker',
      isComplete: false,
      icon: CheckSquare,
    },
  ];

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-6 border-b border-border/40 dark:border-slate-800/60 text-center max-w-2xl mx-auto">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
          <Sparkles className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-bold font-display text-foreground">
          Welcome to Your Study Abroad Roadmap
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">
          Follow these 4 simple steps to prepare your university applications with complete confidence.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 sm:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="p-5 rounded-2xl bg-muted/15 dark:bg-slate-900/50 border border-border/50 dark:border-slate-800/80 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
                        {step.step}
                      </span>
                      <h4 className="font-bold text-sm text-foreground">{step.title}</h4>
                    </div>
                    {step.isComplete && (
                      <Badge variant="outline" className="bg-teal-500/10 text-teal-400 border-teal-500/30 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed pl-8">
                    {step.description}
                  </p>
                </div>

                <div className="pl-8">
                  <Button
                    size="sm"
                    variant={step.isComplete ? 'outline' : 'default'}
                    asChild
                    className="text-xs rounded-xl font-semibold h-8"
                  >
                    <Link href={step.href} className="flex items-center gap-1.5">
                      <span>{step.buttonLabel}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
