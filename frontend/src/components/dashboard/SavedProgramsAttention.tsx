'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertCircle, Bell, ArrowRight, ShieldCheck, DollarSign, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SavedProgramChangeItem } from '@/types/studentDashboard';

export interface SavedProgramsAttentionProps {
  changes?: SavedProgramChangeItem[];
  isLoading?: boolean;
}

export function SavedProgramsAttention({ changes = [], isLoading = false }: SavedProgramsAttentionProps) {
  if (changes.length === 0) return null;

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Bell className="h-4 w-4 text-amber-400" />
            Shortlist Updates & Freshness Signals
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Recent verified changes across your saved courses
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="p-0 divide-y divide-border/40 dark:divide-slate-800/60">
        {changes.map((change, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/15 dark:hover:bg-slate-800/30 transition-colors"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs sm:text-sm text-foreground">
                  {change.name}
                </span>
                <span className="text-[11px] text-muted-foreground">({change.universityName})</span>
              </div>
              <p className="text-xs text-muted-foreground">{change.description}</p>
              <p className="text-[10px] text-teal-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {change.sourceFreshness}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="text-xs h-8 px-3 rounded-xl border-border/60 shrink-0 self-start sm:self-center"
            >
              <Link href={`/programs/${change.programId}`}>
                <span>Review Course</span>
                <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
