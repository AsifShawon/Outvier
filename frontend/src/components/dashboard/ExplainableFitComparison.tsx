'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  GraduationCap,
  Languages,
  DollarSign,
  Sliders,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExplainableProgramFit } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface ExplainableFitComparisonProps {
  programs?: ExplainableProgramFit[];
  isLoading?: boolean;
}

export function ExplainableFitComparison({
  programs = [],
  isLoading = false,
}: ExplainableFitComparisonProps) {
  if (programs.length === 0) return null;

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-4 border-b border-border/40 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold font-display text-foreground">
              Explainable Course Fit & Eligibility Alignment
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground p-0.5">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-sm bg-slate-900 text-slate-100 border-slate-700 text-xs leading-relaxed">
                  Fit scores breakdown compares your GPA, English tests, budget ceiling, and study preferences against verified university admission criteria.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Multi-factor evaluation across academic credentials, English requirements, and budget limits
          </CardDescription>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2">
          <Link href="/dashboard/saved">
            <span>View Full Comparison</span>
            <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-6">
        {/* Important Ethical Disclaimer Banner (Requirement 5) */}
        <div className="p-3.5 rounded-2xl bg-purple-500/10 dark:bg-purple-950/30 border border-purple-500/20 flex items-start gap-3 text-xs">
          <Info className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
          <p className="text-purple-300/90 leading-relaxed text-[11px]">
            <span className="font-semibold text-purple-200">Decision-Support Notice: </span>
            Fit scores are algorithmic estimates to assist your self-guided research and shortlist planning. A lower score is <span className="font-semibold text-purple-200">never an official university admission decision</span> or rejection.
          </p>
        </div>

        {/* Program Cards Grid */}
        <div className="space-y-4">
          {programs.map((prog) => (
            <div
              key={prog.programId}
              className="p-4 sm:p-5 rounded-2xl bg-muted/15 dark:bg-slate-900/50 border border-border/50 dark:border-slate-800/80 space-y-4"
            >
              {/* Program Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 dark:border-slate-800/60 pb-3">
                <div>
                  <h4 className="font-bold text-sm sm:text-base text-foreground">
                    {prog.programName}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {prog.universityName} • {prog.state} • ${prog.annualTuitionAud.toLocaleString()} AUD/yr
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Overall Fit:</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-bold px-2.5 py-0.5 rounded-lg',
                      prog.overallFitScore >= 80
                        ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                        : prog.overallFitScore >= 65
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    )}
                  >
                    {prog.overallFitScore}% Alignment
                  </Badge>
                </div>
              </div>

              {/* 4 Component Score Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Academic Fit */}
                <div className="p-3 rounded-xl bg-card dark:bg-slate-800/40 border border-border/40 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-purple-400" />
                      Academic Fit
                    </span>
                    <span className="font-bold text-foreground">{prog.academicFit.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{prog.academicFit.explanation}</p>
                </div>

                {/* 2. English Fit */}
                <div className="p-3 rounded-xl bg-card dark:bg-slate-800/40 border border-border/40 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Languages className="h-3.5 w-3.5 text-teal-400" />
                      English Proficiency
                    </span>
                    <span className="font-bold text-foreground">{prog.englishFit.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{prog.englishFit.explanation}</p>
                </div>

                {/* 3. Budget Fit */}
                <div className="p-3 rounded-xl bg-card dark:bg-slate-800/40 border border-border/40 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                      Budget Fit
                    </span>
                    <span className="font-bold text-foreground">{prog.budgetFit.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{prog.budgetFit.explanation}</p>
                </div>

                {/* 4. Preference Fit */}
                <div className="p-3 rounded-xl bg-card dark:bg-slate-800/40 border border-border/40 dark:border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5 text-blue-400" />
                      Preferences
                    </span>
                    <span className="font-bold text-foreground">{prog.preferenceFit.score}%</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{prog.preferenceFit.explanation}</p>
                </div>
              </div>

              {/* Missing Inputs notice if any */}
              {prog.missingInputs.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Estimated based on missing inputs:
                  </span>
                  {prog.missingInputs.map((input, idx) => (
                    <Badge key={idx} variant="outline" className="text-[10px] bg-amber-500/10 text-amber-300 border-amber-500/30">
                      {input}
                    </Badge>
                  ))}
                  <Button variant="link" size="sm" asChild className="text-[11px] text-primary h-auto p-0 ml-1">
                    <Link href="/dashboard/profile">Provide Details →</Link>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
