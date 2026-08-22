'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  TrendingDown,
  ArrowRight,
  GraduationCap,
  Users,
  FileCheck,
  Award,
  Compass,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ChartContainerWithTable, TableColumn } from './ChartContainerWithTable';
import { PipelineStageItem } from '@/types/adminDashboard';
import { cn } from '@/lib/utils';

export interface ApplicationPipelineFunnelProps {
  data?: PipelineStageItem[];
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
}

export function ApplicationPipelineFunnel({
  data = [],
  isLoading = false,
  isError = false,
  lastUpdated,
}: ApplicationPipelineFunnelProps) {
  const router = useRouter();

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const tableColumns: TableColumn<PipelineStageItem>[] = [
    {
      key: 'stage',
      header: 'Pipeline Stage',
      render: (row) => (
        <span className="font-semibold text-foreground">{row.stage}</span>
      ),
    },
    {
      key: 'count',
      header: 'Active Applications',
      align: 'right',
      render: (row) => (
        <span className="font-bold text-purple-400">{row.count.toLocaleString()}</span>
      ),
    },
    {
      key: 'conversionRate',
      header: 'Step Conversion Rate',
      align: 'right',
      render: (row) => (
        <span
          className={cn(
            'font-semibold',
            row.conversionRate >= 70
              ? 'text-teal-400'
              : row.conversionRate >= 40
              ? 'text-amber-400'
              : 'text-rose-400'
          )}
        >
          {row.conversionRate}%
        </span>
      ),
    },
    {
      key: 'dropOffRate',
      header: 'Stage Drop-off',
      align: 'right',
      render: (row) => (
        <span className="text-rose-400 font-medium">{row.dropOffRate}%</span>
      ),
    },
    {
      key: 'cumulativeConversion',
      header: 'Cumulative Conversion',
      align: 'right',
      render: (row) => (
        <span className="text-slate-300 font-semibold">{row.cumulativeConversion}%</span>
      ),
    },
  ];

  return (
    <ChartContainerWithTable<PipelineStageItem>
      title="Application Pipeline & Funnel"
      subtitle="Conversion and drop-off progression across student workflow milestones"
      questionAnswered="Where are users progressing or dropping off?"
      metricDefinition="Measures student application progression from initial research through shortlisted programs, document preparation, submission, offer acceptance, and visa onboarding."
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isError={isError}
      isEmpty={data.length === 0}
      tableData={data}
      tableColumns={tableColumns}
    >
      <div className="w-full space-y-3.5 py-1">
        {data.map((item, index) => {
          const widthPercent = Math.max(8, Math.round((item.count / maxCount) * 100));
          const isBottleneck = item.dropOffRate > 50 && index > 0;

          return (
            <div
              key={item.stageKey}
              onClick={() => router.push(`/dashboard/tracker?stage=${item.stageKey}`)}
              className={cn(
                'group relative p-2.5 rounded-xl border border-border/50 dark:border-slate-800/60',
                'bg-muted/10 hover:bg-muted/30 dark:hover:bg-slate-800/50 transition-all cursor-pointer'
              )}
            >
              {/* Header Info */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/10 text-purple-400 font-bold text-[10px] border border-purple-500/20">
                    {index + 1}
                  </span>
                  <span className="font-semibold text-foreground group-hover:text-purple-400 transition-colors">
                    {item.stage}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-foreground">
                    {item.count.toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">apps</span>
                  </span>
                  {index > 0 && (
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                        item.conversionRate >= 60
                          ? 'bg-teal-500/10 text-teal-400'
                          : 'bg-amber-500/10 text-amber-400'
                      )}
                    >
                      {item.conversionRate}% conv.
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="h-2 w-full bg-slate-800/40 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    index === 0
                      ? 'bg-purple-500'
                      : index === data.length - 1
                      ? 'bg-teal-400'
                      : 'bg-gradient-to-r from-purple-500 to-teal-400'
                  )}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>

              {/* Drop-off Indicator */}
              {isBottleneck && (
                <div className="mt-1.5 flex items-center gap-1 text-[10px] text-rose-400 font-medium">
                  <TrendingDown className="h-3 w-3" />
                  <span>High Drop-off Rate: {item.dropOffRate}% abandon at this milestone</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ChartContainerWithTable>
  );
}
