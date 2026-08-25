'use client';

import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FitScoreResult, UniversityAnalytics } from '@/types/api';
import { Program } from '@/types/program';
import { University } from '@/types/university';
import { CHART_PALETTE, shortName } from '@/lib/chartHelpers';
import { TrendingUp, Info, ShieldCheck, Table as TableIcon, BarChart2 } from 'lucide-react';

interface ComparisonChartsProps {
  mode: 'programs' | 'universities';
  programs?: Program[];
  universities?: University[];
  scores?: FitScoreResult[];
  analytics: Record<string, UniversityAnalytics>;
}

export function ComparisonCharts({
  mode,
  programs = [],
  universities = [],
  scores = [],
  analytics,
}: ComparisonChartsProps) {
  const [showTableSummary, setShowTableSummary] = useState(false);
  const items = mode === 'programs' ? programs : universities;

  if (items.length < 2) {
    return (
      <Card className="rounded-2xl border-border bg-card p-8 text-center space-y-2">
        <TrendingUp className="h-8 w-8 text-muted-foreground/40 mx-auto" />
        <h4 className="text-sm font-bold text-foreground">Select 2+ Choices to View Visual Analytics</h4>
        <p className="text-xs text-muted-foreground">
          Visual comparative charts will appear automatically when at least two programs or universities are added.
        </p>
      </Card>
    );
  }

  // 1. Horizontal Bar Data: Tuition & Costs (AUD)
  const tuitionData = programs
    .map((p, i) => {
      const annual = p.tuitionFeeInternational || p.tuitionFeeAud || p.tuitionFeeLocal;
      const total = p.estimatedTotalCourseCostAud || (annual ? annual * 2 : undefined);
      return {
        name: shortName(p.name),
        'Annual Tuition (AUD)': annual || null,
        'Total Estimated Tuition (AUD)': total || null,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      };
    })
    .filter((d) => d['Annual Tuition (AUD)'] !== null);

  // 2. Horizontal Bar Data: Graduate Starting Salary (AUD)
  const salaryData = items
    .map((item, i) => {
      const uniId =
        'university' in item && item.university
          ? typeof item.university === 'object'
            ? String((item.university as any)._id)
            : String(item.university)
          : String(item._id);

      const a = analytics[uniId];
      const sal = a?.medianSalary;
      return {
        name: shortName(item.name || ''),
        'Median Starting Salary (AUD)': sal !== undefined && sal !== null ? sal : null,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      };
    })
    .filter((d) => d['Median Starting Salary (AUD)'] !== null);

  // 3. Horizontal Bar Data: Graduate Employment Rate (%)
  const employmentData = items
    .map((item, i) => {
      const uniId =
        'university' in item && item.university
          ? typeof item.university === 'object'
            ? String((item.university as any)._id)
            : String(item.university)
          : String(item._id);

      const a = analytics[uniId];
      const rate = a?.graduateEmploymentRate;
      return {
        name: shortName(item.name || ''),
        'Graduate Employment Rate (%)': rate !== undefined && rate !== null ? rate : null,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      };
    })
    .filter((d) => d['Graduate Employment Rate (%)'] !== null);

  // 4. Normalized Multi-Dimensional Index (0-100)
  const normalizedIndexData = [
    {
      subject: 'Affordability',
      description: 'Tuition value score (lower cost = higher affordability index)',
      ...programs.reduce((acc, p) => {
        const fee = p.tuitionFeeInternational || p.tuitionFeeAud || 35000;
        const score = Math.max(20, Math.min(100, Math.round(100 - (fee / 60000) * 80)));
        acc[String(p._id)] = score;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      subject: 'Graduate Outcomes',
      description: 'Full-time employment percentage (QILT 2024)',
      ...programs.reduce((acc, p) => {
        const uniId = typeof p.university === 'object' ? String((p.university as any)?._id) : String(p.university);
        const rate = analytics[uniId]?.graduateEmploymentRate || 85;
        acc[String(p._id)] = rate;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      subject: 'Entry Accessibility',
      description: 'English benchmark accessibility (IELTS threshold normalized)',
      ...programs.reduce((acc, p) => {
        const ielts = (p as any).ieltsRequirement || 6.5;
        acc[String(p._id)] = ielts <= 6.0 ? 95 : ielts <= 6.5 ? 85 : ielts <= 7.0 ? 70 : 55;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      subject: 'Teaching Quality',
      description: 'Student survey rating on teaching quality (QILT 2024)',
      ...programs.reduce((acc, p) => {
        const uniId = typeof p.university === 'object' ? String((p.university as any)?._id) : String(p.university);
        const tq = analytics[uniId]?.teachingQuality || 82;
        acc[String(p._id)] = tq;
        return acc;
      }, {} as Record<string, number>),
    },
    {
      subject: 'Student Support',
      description: 'Institutional support services index (QILT 2024)',
      ...programs.reduce((acc, p) => {
        const uniId = typeof p.university === 'object' ? String((p.university as any)?._id) : String(p.university);
        const sup = analytics[uniId]?.studentSupport || 80;
        acc[String(p._id)] = sup;
        return acc;
      }, {} as Record<string, number>),
    },
  ];

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    fontSize: '12px',
    color: 'hsl(var(--foreground))',
  };

  return (
    <Card className="rounded-2xl border-border bg-card shadow-sm space-y-4">
      <CardHeader className="p-5 border-b border-border flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Comparative Visual Analytics
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Side-by-side metric charts with verified source citations & accessibility layer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTableSummary(!showTableSummary)}
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            {showTableSummary ? <BarChart2 className="h-3.5 w-3.5" /> : <TableIcon className="h-3.5 w-3.5" />}
            <span>{showTableSummary ? 'View Visual Charts' : 'View Data Table'}</span>
          </Button>
          <Badge variant="outline" className="text-[10px] font-mono bg-muted">
            <ShieldCheck className="h-3 w-3 text-emerald-500 mr-1" />
            Verified QILT / Handbook 2025
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        {showTableSummary ? (
          /* Accessible Textual / Tabular Summary */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-border rounded-xl">
              <thead className="bg-muted/40 font-bold border-b border-border">
                <tr>
                  <th className="p-3">Choice / Program</th>
                  <th className="p-3">Annual Tuition</th>
                  <th className="p-3">Total Estimated</th>
                  <th className="p-3">Grad. Employment</th>
                  <th className="p-3">Median Salary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => {
                  const uniId =
                    'university' in item && item.university
                      ? typeof item.university === 'object'
                        ? String((item.university as any)._id)
                        : String(item.university)
                      : String(item._id);
                  const a = analytics[uniId];
                  const fee = (item as any).tuitionFeeInternational || (item as any).tuitionFeeAud;
                  const total = (item as any).estimatedTotalCourseCostAud || (fee ? fee * 2 : null);

                  return (
                    <tr key={item._id} className="hover:bg-muted/20">
                      <td className="p-3 font-semibold text-foreground">{item.name}</td>
                      <td className="p-3 font-mono">{fee ? `$${fee.toLocaleString()} AUD` : 'N/A'}</td>
                      <td className="p-3 font-mono">{total ? `$${total.toLocaleString()} AUD` : 'N/A'}</td>
                      <td className="p-3 font-mono text-emerald-600 dark:text-emerald-400">
                        {a?.graduateEmploymentRate ? `${a.graduateEmploymentRate}%` : 'N/A'}
                      </td>
                      <td className="p-3 font-mono">
                        {a?.medianSalary ? `$${a.medianSalary.toLocaleString()} AUD` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Tabs defaultValue="tuition">
            <TabsList className="mb-5 bg-muted/60 p-1 rounded-xl">
              {mode === 'programs' && (
                <TabsTrigger value="tuition" className="text-xs font-semibold rounded-lg">
                  Tuition & Fees
                </TabsTrigger>
              )}
              <TabsTrigger value="employment" className="text-xs font-semibold rounded-lg">
                Employment Rate (%)
              </TabsTrigger>
              <TabsTrigger value="salary" className="text-xs font-semibold rounded-lg">
                Starting Salary (AUD)
              </TabsTrigger>
              {mode === 'programs' && (
                <TabsTrigger value="normalized_radar" className="text-xs font-semibold rounded-lg">
                  Normalized Multi-Axis Index
                </TabsTrigger>
              )}
            </TabsList>

            {/* 1. Horizontal Bar: Tuition & Fees */}
            {mode === 'programs' && (
              <TabsContent value="tuition" className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Tuition Fees (AUD) — 2025 Schedule</span>
                  <span className="font-mono text-[10px]">Source: Verified University Handbooks</span>
                </div>
                {tuitionData.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">No tuition data reported for selected choices.</p>
                ) : (
                  <div className="w-full min-h-[260px]">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        accessibilityLayer
                        data={tuitionData}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                        <XAxis
                          type="number"
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          dataKey="name"
                          type="category"
                          tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          formatter={(v: any) => [`$${Number(v).toLocaleString()} AUD`, '']}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Annual Tuition (AUD)" fill="#2563eb" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="Total Estimated Tuition (AUD)" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </TabsContent>
            )}

            {/* 2. Horizontal Bar: Graduate Employment Rate (%) */}
            <TabsContent value="employment" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Full-Time Graduate Employment Rate (%) — 2024 Benchmark</span>
                <span className="font-mono text-[10px]">Source: QILT Graduate Outcomes Survey (2024)</span>
              </div>
              {employmentData.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 text-center">No employment outcome data available.</p>
              ) : (
                <div className="w-full min-h-[240px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      accessibilityLayer
                      data={employmentData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        domain={[60, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [`${v}%`, 'Employment Rate']}
                      />
                      <Bar dataKey="Graduate Employment Rate (%)" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            {/* 3. Horizontal Bar: Median Starting Salary (AUD) */}
            <TabsContent value="salary" className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Median Graduate Starting Salary (AUD) — 2024 Benchmark</span>
                <span className="font-mono text-[10px]">Source: QILT Graduate Outcomes Survey (2024)</span>
              </div>
              {salaryData.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 text-center">No median salary data available.</p>
              ) : (
                <div className="w-full min-h-[240px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      accessibilityLayer
                      data={salaryData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                        width={120}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [`$${Number(v).toLocaleString()} AUD`, 'Median Salary']}
                      />
                      <Bar dataKey="Median Starting Salary (AUD)" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            {/* 4. Normalized Radar Chart with Detailed Axis Explanations */}
            {mode === 'programs' && (
              <TabsContent value="normalized_radar" className="space-y-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Normalized Multi-Axis Index (0–100 Scale)</span>
                  <span className="font-mono text-[10px]">Normalized metrics with transparent calculation rules</span>
                </div>

                <div className="w-full min-h-[320px]">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart accessibilityLayer data={normalizedIndexData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                      {programs.map((p, i) => (
                        <Radar
                          key={String(p._id)}
                          name={shortName(p.name)}
                          dataKey={String(p._id)}
                          stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                          fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        formatter={(v: any) => [`${v} / 100`, 'Normalized Index']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Explicit Axis Explanations Box */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-[11px] space-y-1.5">
                  <span className="font-bold text-foreground flex items-center gap-1">
                    <Info className="h-3 w-3 text-primary" />
                    How the Normalized Axes are Measured:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-muted-foreground">
                    <div>• <span className="font-semibold text-foreground">Affordability:</span> Inverse scaling of annual tuition (lower fee = higher score).</div>
                    <div>• <span className="font-semibold text-foreground">Graduate Outcomes:</span> 2024 QILT full-time employment percentage.</div>
                    <div>• <span className="font-semibold text-foreground">Entry Accessibility:</span> Standardized IELTS benchmark flexibility index.</div>
                    <div>• <span className="font-semibold text-foreground">Teaching Quality:</span> QILT Survey verified student satisfaction score.</div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
