'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { ChartContainerWithTable, TableColumn } from './ChartContainerWithTable';
import { SourceHealthItem } from '@/types/adminDashboard';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SourceHealthChartProps {
  data?: SourceHealthItem[];
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
}

export function SourceHealthChart({
  data = [],
  isLoading = false,
  isError = false,
  lastUpdated,
}: SourceHealthChartProps) {
  const router = useRouter();

  const tableColumns: TableColumn<SourceHealthItem>[] = [
    {
      key: 'name',
      header: 'Source / Connector',
      render: (row) => (
        <div>
          <span className="font-semibold text-foreground">{row.name}</span>
          <span className="block text-[10px] text-muted-foreground capitalize">{row.type.replace(/_/g, ' ')}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Health Status',
      align: 'center',
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] capitalize font-semibold',
            row.status === 'healthy'
              ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
              : row.status === 'warning'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          )}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'slaHours',
      header: 'Freshness SLA',
      align: 'right',
      render: (row) => `${row.slaHours}h target`,
    },
    {
      key: 'lastSyncAt',
      header: 'Last Synchronization',
      align: 'right',
      render: (row) => {
        if (!row.lastSyncAt) return <span className="text-muted-foreground">Never</span>;
        try {
          return `${formatDistanceToNow(parseISO(row.lastSyncAt))} ago`;
        } catch {
          return row.lastSyncAt;
        }
      },
    },
  ];

  return (
    <ChartContainerWithTable<SourceHealthItem>
      title="Upstream Source Health & SLA"
      subtitle="Operational status and SLA freshness across external data feeds"
      questionAnswered="Are ingestion and sync pipelines healthy?"
      metricDefinition="Monitors ingestion health and SLA compliance of CRICOS CKAN, university portals, rankings feeds, and batch CSV imports."
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isError={isError}
      isEmpty={data.length === 0}
      tableData={data}
      tableColumns={tableColumns}
    >
      <div className="h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            accessibilityLayer
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
            <XAxis type="number" fontSize={11} tick={{ fill: '#94A3B8' }} unit="%" domain={[0, 100]} />
            <YAxis
              dataKey="name"
              type="category"
              fontSize={10}
              tick={{ fill: '#CBD5E1' }}
              width={110}
              tickFormatter={(val) => (val.length > 15 ? `${val.slice(0, 15)}...` : val)}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5">
                      <p className="font-semibold text-slate-100">{label}</p>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex justify-between gap-3">
                          <span className="text-slate-400 capitalize">{p.name}:</span>
                          <span className="font-bold" style={{ color: p.color }}>
                            {p.value}%
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ paddingBottom: '8px', fontSize: '10px' }}
            />
            <Bar dataKey="healthy" name="Healthy" stackId="a" fill="#14B8A6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="warning" name="Warning" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failing" name="Failing" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainerWithTable>
  );
}
