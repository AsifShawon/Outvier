'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ChartContainerWithTable, TableColumn } from './ChartContainerWithTable';
import { DataHealthPoint } from '@/types/adminDashboard';

export interface DataHealthChartProps {
  data?: DataHealthPoint[];
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
  timeScope?: string;
}

export function DataHealthChart({
  data = [],
  isLoading = false,
  isError = false,
  lastUpdated,
  timeScope,
}: DataHealthChartProps) {
  const router = useRouter();

  const handlePointClick = (entry: any) => {
    if (entry && entry.activePayload && entry.activePayload.length > 0) {
      const activeDataKey = entry.activePayload[0]?.dataKey;
      if (activeDataKey === 'stale') {
        router.push('/admin/programs?filter=stale');
      } else if (activeDataKey === 'incomplete') {
        router.push('/admin/programs?filter=needs_review');
      } else {
        router.push('/admin/programs?status=active');
      }
    }
  };

  const tableColumns: TableColumn<DataHealthPoint>[] = [
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
      key: 'verified',
      header: 'Verified Records',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-teal-400">{row.verified.toLocaleString()}</span>
      ),
    },
    {
      key: 'stale',
      header: 'Stale Records',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-amber-400">{row.stale.toLocaleString()}</span>
      ),
    },
    {
      key: 'incomplete',
      header: 'Incomplete / Review Needed',
      align: 'right',
      render: (row) => (
        <span className="font-semibold text-rose-400">{row.incomplete.toLocaleString()}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total Volume',
      align: 'right',
      render: (row) => (row.verified + row.stale + row.incomplete).toLocaleString(),
    },
  ];

  const totalVerified = data.reduce((acc, curr) => acc + curr.verified, 0);
  const totalStale = data.reduce((acc, curr) => acc + curr.stale, 0);
  const totalIncomplete = data.reduce((acc, curr) => acc + curr.incomplete, 0);

  return (
    <ChartContainerWithTable<DataHealthPoint>
      title="Data Health & Freshness Over Time"
      subtitle="Multi-series tracking verified active catalog records vs stale and incomplete records"
      questionAnswered="Is public data current and trustworthy?"
      metricDefinition="Tracks the daily health trajectory of catalog programs. Verified: score ≥ 70 with zero missing mandatory fields; Stale: not verified or updated in 90+ days; Incomplete: missing fee/CRICOS/admission attributes."
      timeScope={timeScope || 'Selected date range'}
      lastUpdated={lastUpdated}
      isLoading={isLoading}
      isError={isError}
      isEmpty={data.length === 0}
      tableData={data}
      tableColumns={tableColumns}
    >
      <div className="h-[280px] sm:h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            accessibilityLayer
            onClick={handlePointClick}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              {/* Teal Gradient for Verified */}
              <linearGradient id="colorVerified" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.0} />
              </linearGradient>
              {/* Amber Gradient for Stale */}
              <linearGradient id="colorStale" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
              {/* Rose Gradient for Incomplete */}
              <linearGradient id="colorIncomplete" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

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
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl backdrop-blur-sm text-xs space-y-2">
                      <p className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
                        {formattedDate}
                      </p>
                      <div className="space-y-1.5">
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1.5 text-slate-400 capitalize">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: entry.color }}
                              />
                              {entry.name}:
                            </span>
                            <span className="font-bold text-slate-100">
                              {entry.value?.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-800">
                        Click data point to view corresponding catalog records.
                      </p>
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
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-slate-300 font-medium capitalize mr-3">{value}</span>
              )}
            />

            <Area
              type="monotone"
              dataKey="verified"
              name="verified"
              stroke="#14B8A6"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorVerified)"
            />
            <Area
              type="monotone"
              dataKey="stale"
              name="stale"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorStale)"
            />
            <Area
              type="monotone"
              dataKey="incomplete"
              name="incomplete"
              stroke="#EF4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorIncomplete)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartContainerWithTable>
  );
}
