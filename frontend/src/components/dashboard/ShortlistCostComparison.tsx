'use client';

import * as React from 'react';
import Link from 'next/link';
import { DollarSign, ArrowRight, CheckCircle2, TrendingUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ExplainableProgramFit } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface ShortlistCostComparisonProps {
  programs?: ExplainableProgramFit[];
  targetBudgetAud?: number;
  isLoading?: boolean;
}

export function ShortlistCostComparison({
  programs = [],
  targetBudgetAud = 40000,
  isLoading = false,
}: ShortlistCostComparisonProps) {
  if (programs.length === 0) return null;

  const maxFee = Math.max(...programs.map((p) => p.annualTuitionAud), targetBudgetAud * 1.2, 55000);

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base sm:text-lg font-bold font-display text-foreground">
              Tuition Cost vs Target Budget Ceiling
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground p-0.5">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-900 text-slate-100 border-slate-700 text-xs">
                  Compares annual tuition fees for shortlisted courses against your target budget of ${targetBudgetAud.toLocaleString()} AUD/year.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Target annual budget ceiling: <span className="font-semibold text-foreground">${targetBudgetAud.toLocaleString()} AUD/year</span>
          </CardDescription>
        </div>

        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2">
          <Link href="/dashboard/budget">
            <span>Edit Budget Plan</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-5 sm:p-6 space-y-4">
        {programs.map((prog) => {
          const fee = prog.annualTuitionAud;
          const feePercent = Math.min(100, Math.round((fee / maxFee) * 100));
          const budgetPercent = Math.min(100, Math.round((targetBudgetAud / maxFee) * 100));
          const isAffordable = fee <= targetBudgetAud;

          return (
            <div key={prog.programId} className="space-y-1.5 p-3 rounded-2xl bg-muted/10 dark:bg-slate-900/40 border border-border/40 dark:border-slate-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                <div>
                  <span className="font-bold text-foreground text-sm">{prog.programName}</span>
                  <span className="text-muted-foreground ml-1.5">({prog.universityName})</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-foreground">
                    ${fee.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">AUD/yr</span>
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-bold px-2 py-0.2 rounded-md',
                      isAffordable
                        ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                    )}
                  >
                    {isAffordable ? 'Within Budget' : 'Stretch Option'}
                  </Badge>
                </div>
              </div>

              {/* Horizontal Bar Visual */}
              <div className="relative h-3 w-full bg-slate-800/30 rounded-full overflow-hidden">
                {/* Course Fee Bar */}
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isAffordable ? 'bg-teal-400' : 'bg-amber-400'
                  )}
                  style={{ width: `${feePercent}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
