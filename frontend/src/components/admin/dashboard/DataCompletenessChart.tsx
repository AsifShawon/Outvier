'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Cell,
} from 'recharts';
import { ChartContainerWithTable, TableColumn } from './ChartContainerWithTable';
import { FieldCompletenessItem } from '@/types/adminDashboard';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface DataCompletenessChartProps {
  data?: FieldCompletenessItem[];
  isLoading?: boolean;
  isError?: boolean;
  lastUpdated?: string;
}

export function DataCompletenessChart({
  data = [],
  isLoading = false,
  isError = false,
  lastUpdated,
}: DataCompletenessChartProps) {
  const tableColumns: TableColumn<FieldCompletenessItem>[] = [
    {
      key: 'label',
      header: 'Catalog Attribute',
      render: (row) => (
        <span className="font-semibold text-foreground">{row.label}</span>
      ),
    },
    {
      key: 'criticality',
      header: 'Criticality',
      align: 'center',
      render: (row) => (
        <Badge
          variant="outline"
          className={cn(
            'text-[10px] uppercase font-bold tracking-wider',
            row.criticality === 'high'
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : row.criticality === 'medium'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              : 'bg-slate-500/10 text-slate-400 border-slate-700/50'
          )}
        >
          {row.criticality}
        </Badge>
      ),
    },
    {
      key: 'completedPercentage',
      header: 'Populated Coverage',
      align: 'right',
      render: (row) => (
        <span
          className={cn(
            'font-bold',
            row.completedPercentage >= 80
              ? 'text-teal-400'
              : row.completedPercentage >= 50
              ? 'text-amber-400'
              : 'text-rose-400'
          )}
        >
          {row.completedPercentage}%
        </span>
      ),
    },
    {
      key: 'populatedCount',
      header: 'Populated Records',
      align: 'right',
      render: (row) => `${row.populatedCount.toLocaleString()} / ${row.totalRecords.toLocaleString()}`,
    },
    {
      key: 'missingCount',
      header: 'Missing Records',
      align: 'right',
      render: (row) => (
        <span className="text-rose-400 font-medium">{row.missingCount.toLocaleString()}</span>
      ),
    },
  ];

  return (
    <ChartContainerWithTable<FieldCompletenessItem>
      title="Data Completeness by Field"
      subtitle="Coverage density across critical program requirements, fees, and admission criteria"
      questionAnswered="Is public data current and trustworthy?"
      metricDefinition="Measures the percentage of active catalog courses with non-null values for key admission, cost, and structural attributes."
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
            margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
            <XAxis type="number" fontSize={11} tick={{ fill: '#94A3B8' }} unit="%" domain={[0, 100]} />
            <YAxis
              dataKey="label"
              type="category"
              fontSize={10}
              tick={{ fill: '#CBD5E1' }}
              width={125}
              tickFormatter={(val) => (val.length > 18 ? `${val.slice(0, 18)}...` : val)}
            />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as FieldCompletenessItem;
                  return (
                    <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl text-xs space-y-1.5">
                      <p className="font-semibold text-slate-100">{item.label}</p>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Completeness:</span>
                        <span className="font-bold text-teal-400">{item.completedPercentage}%</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Populated:</span>
                        <span className="font-semibold text-slate-200">
                          {item.populatedCount.toLocaleString()} / {item.totalRecords.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-400">Missing:</span>
                        <span className="font-semibold text-rose-400">{item.missingCount.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="completedPercentage" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => {
                const color =
                  entry.completedPercentage >= 80
                    ? '#14B8A6'
                    : entry.completedPercentage >= 50
                    ? '#F59E0B'
                    : '#EF4444';
                return <Cell key={`cell-${index}`} fill={color} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartContainerWithTable>
  );
}
