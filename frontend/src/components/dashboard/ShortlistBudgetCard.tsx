'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowRight, DollarSign, CheckCircle2, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShortlistSummaryData } from '@/types/studentDashboard';

export interface ShortlistBudgetCardProps {
  shortlist?: ShortlistSummaryData;
  isLoading?: boolean;
}

export function ShortlistBudgetCard({ shortlist, isLoading = false }: ShortlistBudgetCardProps) {
  const total = shortlist?.totalCount || 0;
  const affordable = shortlist?.affordableCount || 0;
  const stretch = shortlist?.stretchCount || 0;
  const budget = shortlist?.budgetLimitAud || 40000;

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full hover:border-teal-500/40 transition-colors">
      <CardContent className="p-0 space-y-3 flex flex-col justify-between h-full">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Shortlist & Budget
            </span>
            <Bookmark className="h-4 w-4 text-muted-foreground/60" />
          </div>

          {/* Value */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-bold font-display text-foreground tracking-tight">
              {total}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              Saved Course{total === 1 ? '' : 's'}
            </span>
          </div>

          {/* Affordability breakdown */}
          <div className="mt-2.5 space-y-1.5 pt-2 border-t border-border/40 dark:border-slate-800/60 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
                Within target budget:
              </span>
              <span className="font-bold text-teal-400">{affordable}</span>
            </div>

            {stretch > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-amber-400" />
                  Above target budget:
                </span>
                <span className="font-semibold text-amber-400">{stretch} (Stretch)</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-1">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-between text-xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-xl px-3 h-8"
          >
            <Link href="/dashboard/saved">
              <span>{total > 0 ? 'Compare All Shortlisted' : 'Start Shortlisting'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
