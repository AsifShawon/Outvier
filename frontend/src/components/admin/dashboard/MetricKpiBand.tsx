'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  RefreshCw,
  GraduationCap,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  HelpCircle,
  ArrowUpRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { KpiMetric } from '@/types/adminDashboard';

export interface MetricKpiBandProps {
  kpis?: {
    verifiedActivePrograms: KpiMetric;
    staleRecords: KpiMetric;
    pendingStagedChanges: KpiMetric;
    successfulSyncRate: KpiMetric;
    activeApplications: KpiMetric;
    overdueTasks: KpiMetric;
  };
  isLoading?: boolean;
  isError?: boolean;
}

interface SingleCardConfig {
  key: string;
  title: string;
  metric?: KpiMetric;
  icon: React.ElementType;
  href: string;
  suffix?: string;
  isPercent?: boolean;
  positiveIsGood?: boolean;
  accentColor: 'teal' | 'amber' | 'purple' | 'rose' | 'blue';
}

export function MetricKpiBand({ kpis, isLoading = false, isError = false }: MetricKpiBandProps) {
  const cards: SingleCardConfig[] = [
    {
      key: 'verifiedActivePrograms',
      title: 'Verified Programs',
      metric: kpis?.verifiedActivePrograms,
      icon: CheckCircle2,
      href: '/admin/programs?status=active',
      positiveIsGood: true,
      accentColor: 'teal',
    },
    {
      key: 'staleRecords',
      title: 'Stale Records',
      metric: kpis?.staleRecords,
      icon: AlertTriangle,
      href: '/admin/programs?filter=stale',
      positiveIsGood: false,
      accentColor: 'amber',
    },
    {
      key: 'pendingStagedChanges',
      title: 'Pending Staged',
      metric: kpis?.pendingStagedChanges,
      icon: GitCompare,
      href: '/admin/staged-changes',
      positiveIsGood: false,
      accentColor: 'purple',
    },
    {
      key: 'successfulSyncRate',
      title: 'Sync Success Rate',
      metric: kpis?.successfulSyncRate,
      icon: RefreshCw,
      href: '/admin/cricos/runs',
      suffix: '%',
      isPercent: true,
      positiveIsGood: true,
      accentColor: 'teal',
    },
    {
      key: 'activeApplications',
      title: 'Active Applications',
      metric: kpis?.activeApplications,
      icon: GraduationCap,
      href: '/dashboard/tracker',
      positiveIsGood: true,
      accentColor: 'blue',
    },
    {
      key: 'overdueTasks',
      title: 'Overdue Tasks',
      metric: kpis?.overdueTasks,
      icon: Clock,
      href: '/dashboard/tracker?filter=overdue',
      positiveIsGood: false,
      accentColor: 'rose',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28 rounded-2xl bg-card/80 dark:bg-slate-900/60 border border-border/60"
          />
        ))}
      </div>
    );
  }

  const colorStyles = {
    teal: {
      bg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      iconBg: 'bg-teal-500/15 text-teal-400',
      badge: 'bg-teal-500/10 text-teal-300',
    },
    amber: {
      bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15 text-amber-400',
      badge: 'bg-amber-500/10 text-amber-300',
    },
    purple: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      iconBg: 'bg-purple-500/15 text-purple-400',
      badge: 'bg-purple-500/10 text-purple-300',
    },
    rose: {
      bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      iconBg: 'bg-rose-500/15 text-rose-400',
      badge: 'bg-rose-500/10 text-rose-300',
    },
    blue: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconBg: 'bg-blue-500/15 text-blue-400',
      badge: 'bg-blue-500/10 text-blue-300',
    },
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
      {cards.map((card) => {
        const metric = card.metric;
        const Icon = card.icon;
        const val = metric ? metric.value : 0;
        const delta = metric?.changePercent ?? 0;
        const isUp = (metric?.change ?? 0) > 0;
        const isDown = (metric?.change ?? 0) < 0;
        const isNeutral = (metric?.change ?? 0) === 0;

        // Is positive change good for this specific metric?
        const isGoodChange = card.positiveIsGood ? isUp : isDown;
        const isBadChange = card.positiveIsGood ? isDown : isUp;

        const trendColorClass = isNeutral
          ? 'text-muted-foreground bg-muted/40'
          : isGoodChange
          ? 'text-teal-400 bg-teal-500/10 border-teal-500/20'
          : 'text-rose-400 bg-rose-500/10 border-rose-500/20';

        const style = colorStyles[card.accentColor];

        return (
          <Link key={card.key} href={card.href} className="group block focus:outline-none">
            <Card
              className={cn(
                'relative overflow-hidden transition-all duration-200 shadow-sm rounded-2xl',
                'bg-card/90 dark:bg-[#121929] border border-border/80 dark:border-slate-800/80',
                'hover:border-primary/50 hover:shadow-md dark:hover:border-purple-500/40'
              )}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col justify-between h-full space-y-3">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground truncate uppercase tracking-wider">
                      {card.title}
                    </p>
                    {metric?.definition && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                              aria-label={`${card.title} definition`}
                            >
                              <HelpCircle className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-slate-900 text-slate-100 border-slate-700 text-xs">
                            {metric.definition}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  <div className={cn('p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105', style.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                {/* Metric value and delta row */}
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
                      {val.toLocaleString()}
                      {card.suffix}
                    </span>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Calculated period delta */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span
                      className={cn(
                        'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold border text-[10px]',
                        trendColorClass
                      )}
                      aria-label={`${card.title} change: ${delta}%`}
                    >
                      {isUp ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : isDown ? (
                        <TrendingDown className="h-3 w-3" />
                      ) : (
                        <Minus className="h-3 w-3" />
                      )}
                      <span>
                        {isUp ? '+' : ''}
                        {delta}%
                      </span>
                    </span>

                    <span className="text-muted-foreground/70 text-[10px] truncate max-w-[80px]">
                      {metric?.timeScope || 'vs prev'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
