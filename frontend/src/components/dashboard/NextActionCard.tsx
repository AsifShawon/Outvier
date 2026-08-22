'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  CheckCircle,
  Clock,
  FileText,
  Bookmark,
  Compass,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NextActionData } from '@/types/studentDashboard';
import { cn } from '@/lib/utils';

export interface NextActionCardProps {
  action?: NextActionData;
  isLoading?: boolean;
}

export function NextActionCard({ action, isLoading = false }: NextActionCardProps) {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'profile':
        return Compass;
      case 'document':
        return FileText;
      case 'shortlist':
        return Bookmark;
      case 'task':
        return CheckCircle;
      default:
        return Sparkles;
    }
  };

  const Icon = getIcon(action?.type);

  return (
    <Card className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full hover:border-purple-500/40 transition-colors">
      <CardContent className="p-0 space-y-3 flex flex-col justify-between h-full">
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Next Priority Step
            </span>
            {action?.badge && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full',
                  action.urgency === 'high'
                    ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                )}
              >
                {action.badge}
              </Badge>
            )}
          </div>

          {/* Action Title & Description */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold font-display text-foreground leading-snug">
              {action?.title || 'Review Your Study Plan'}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {action?.description || 'Continue refining your profile to discover personalized course matches.'}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="pt-2">
          <Button
            size="sm"
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl h-9 shadow-sm"
          >
            <Link href={action?.actionUrl || '/dashboard/profile'} className="flex items-center justify-center gap-1.5">
              <span>{action?.buttonLabel || 'Continue'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
