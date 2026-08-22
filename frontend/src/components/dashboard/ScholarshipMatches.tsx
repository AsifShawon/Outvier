'use client';

import * as React from 'react';
import Link from 'next/link';
import { Award, ArrowRight, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScholarshipMatchItem } from '@/types/studentDashboard';

export interface ScholarshipMatchesProps {
  scholarships?: ScholarshipMatchItem[];
  isLoading?: boolean;
}

export function ScholarshipMatches({ scholarships = [], isLoading = false }: ScholarshipMatchesProps) {
  if (scholarships.length === 0) return null;

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl shadow-xs overflow-hidden">
      <CardHeader className="p-5 sm:p-6 pb-3 border-b border-border/40 dark:border-slate-800/60 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-purple-400" />
            Matching University Scholarships
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Financial aid and merit-based grants for international applicants
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs font-semibold text-primary h-8 px-2">
          <Link href="/scholarships">
            <span>Explore All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="p-5 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scholarships.map((sch) => (
            <div
              key={sch.id}
              className="p-4 rounded-2xl bg-muted/15 dark:bg-slate-900/40 border border-border/50 dark:border-slate-800/80 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1">
                    {sch.title}
                  </h4>
                  <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-400 border-teal-500/30 shrink-0 font-semibold">
                    {sch.amount}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{sch.universityName}</p>
                <p className="text-xs text-muted-foreground/90 line-clamp-2 leading-relaxed">
                  {sch.eligibilitySnippet}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40 dark:border-slate-800/60 text-xs">
                <span className="text-[10px] text-muted-foreground">
                  {sch.daysRemaining !== undefined
                    ? `Deadline in ${sch.daysRemaining} days`
                    : 'Open for upcoming intake'}
                </span>

                <Button variant="ghost" size="sm" asChild className="text-xs text-primary h-7 px-2 font-semibold">
                  <Link href={`/scholarships/${sch.slug || sch.id}`}>
                    <span>Apply / View</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
