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
import { format, parseISO } from 'date-fns';
import { ChartContainerWithTable, TableColumn } from './ChartContainerWithTable';
import { SyncReliabilityPoint } from '@/types/adminDashboard';

export interface SyncReliabilityChartProps {
  data?: SyncReliabilityPoint[];
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
}

export function SyncReliabilityChart({
  data = [],
  isLoading = false,
  isError = false,
  lastUpdated,
}: SyncReliabilityChartProps) {
  const router = useRouter();

  const handleBarClick = () => {
    router.push('/admin/cricos/runs');
  };

  const tableColumns: TableColumn<SyncReliabilityPoint>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (row) => {
        try {
          return format(parseISO(row.date), 'MMM dd, yyyy');
        } catch {
          return row.date;
        }
      },
    },
    {
      key: 'successful',
      header: 'Successful Runs',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-teal-400">{row.successful.toLocaleString()}</span>
      ),
    },
    {
      key: 'partial',
      header: 'Partial / Warning Runs',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-amber-400">{row.partial.toLocaleString()}</span>
      ),
    },
    {
      key: 'failed',
      header: 'Failed Runs',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-rose-400">{row.failed.toLocaleString()}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Sync Executions',
      align: 'right',
      render: (row) => (row.successful + row.partial + row.failed).toLocaleString(),
    },
  ];

  return (
    <ChartContainerWithTable<SyncReliabilityPoint>
      title="Sync & Ingestion Reliability"
      subtitle="Execution outcome history across CRICOS and direct ingestion jobs"
      questionAnswered="Is the platform technically healthy?"
      metricDefinition="Tracks the daily completion success, warning/partial, and failure count for all automated synchronization and web scraping jobs."
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
            onClick={handleBarClick}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="date"
              fontSize={11}
              tickFormatter={(val) => {
                try {
                  return format(parseISO(val), 'MMM dd');
                } catch {
                  return val;
                }
              }}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8' }}
              dy={8}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              fontSize={11}
              tick={{ fill: '#94A3B8' }}
              allowDecimals={false}
            />
            <RechartsTooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  let formattedDate = String(label || '');
                  try {
                    if (label) {
                      formattedDate = format(parseISO(String(label)), 'EEEE, MMMM dd, yyyy');
                    }
                  } catch {}

                  return (
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5">
                      <p className="font-semibold text-slate-100">{formattedDate}</p>
                      {payload.map((p: any) => (
                        <div key={p.name} className="flex justify-between gap-4">
                          <span className="text-slate-400 capitalize">{p.name}:</span>
                          <span className="font-bold" style={{ color: p.color }}>
                            {p.value} runs
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
              formatter={(value) => (
                <span className="text-slate-300 font-medium capitalize mr-2">{value}</span>
              )}
            />
            <Bar dataKey="successful" name="Successful" stackId="a" fill="#14B8A6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="partial" name="Partial" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" name="Failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainerWithTable>
  );
}
