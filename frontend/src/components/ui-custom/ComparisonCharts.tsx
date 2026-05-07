'use client';

import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FitScoreResult, UniversityAnalytics } from '@/types/api';
import { CHART_PALETTE, buildRadarData, shortName } from '@/lib/chartHelpers';

interface ComparisonChartsProps {
  mode: 'programs' | 'universities';
  programs?: any[];
  universities?: any[];
  scores?: FitScoreResult[];
  analytics: Record<string, UniversityAnalytics>;
}

function NoData({ message = 'No data available for this view.' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-slate-400 text-sm">{message}</div>
  );
}

export function ComparisonCharts({ mode, programs = [], universities = [], scores = [], analytics }: ComparisonChartsProps) {
  const items = mode === 'programs' ? programs : universities;
  if (items.length < 2) return null;

  // ── Programs: Fit Score Radar ──────────────────────────────────────────────
  const radarData = buildRadarData(programs, scores);
  const hasRadarData = scores.length >= 2 && programs.length >= 2;

  // ── Cost chart data ────────────────────────────────────────────────────────
  const costData = mode === 'programs'
    ? programs.map((p, i) => {
        const m = scores.find(s => s.programId === String(p._id))?.rawMetrics;
        return {
          name: shortName(p.name),
          'Annual Tuition': m?.annualTuitionAud ?? 0,
          'Total Cost': m?.totalTuitionAud ?? 0,
          fill: CHART_PALETTE[i % CHART_PALETTE.length],
        };
      })
    : universities.map((u, i) => ({
        name: shortName(u.name ?? u.shortName ?? 'University'),
        'Avg. Tuition': u.averageEstimatedTotalCostAud ?? analytics[String(u._id)]?.medianSalary ?? 0,
        fill: CHART_PALETTE[i % CHART_PALETTE.length],
      }));
  const hasCostData = costData.some(d =>
    mode === 'programs'
      ? (d['Annual Tuition'] as number) > 0
      : (d['Avg. Tuition'] as number) > 0
  );

  // ── Rankings chart data ────────────────────────────────────────────────────
  const rankData = items.map((item, i) => {
    const uniId = mode === 'programs'
      ? String(item.university?._id || item.university)
      : String(item._id);
    const a = analytics[uniId];
    return {
      name: shortName(mode === 'programs' ? item.name : (item.name ?? item.shortName)),
      rank: a?.globalRank ?? 0,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });
  const hasRankData = rankData.some(d => d.rank > 0);

  // ── Outcomes chart data ────────────────────────────────────────────────────
  const outcomesData = items.map((item, i) => {
    const uniId = mode === 'programs'
      ? String(item.university?._id || item.university)
      : String(item._id);
    const a = analytics[uniId];
    const m = mode === 'programs'
      ? scores.find(s => s.programId === String(item._id))?.rawMetrics
      : undefined;
    return {
      name: shortName(mode === 'programs' ? item.name : (item.name ?? item.shortName)),
      Employment: m?.graduateEmploymentRate ?? a?.graduateEmploymentRate ?? 0,
      Teaching: m?.teachingQuality ?? a?.teachingQuality ?? 0,
      Support: a?.studentSupport ?? 0,
      fill: CHART_PALETTE[i % CHART_PALETTE.length],
    };
  });
  const hasOutcomesData = outcomesData.some(d => d.Employment > 0 || d.Teaching > 0);

  const tooltipStyle = {
    borderRadius: '10px',
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
    fontSize: 12,
  };

  return (
    <Card className="mb-6 border-slate-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-slate-700">Visual Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mode === 'programs' ? 'fit' : 'rankings'}>
          <TabsList className="mb-4">
            {mode === 'programs' && <TabsTrigger value="fit">Fit Score</TabsTrigger>}
            <TabsTrigger value="cost">Cost</TabsTrigger>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
          </TabsList>

          {/* ── Fit Score Radar (programs only) ───────────────────────────── */}
          {mode === 'programs' && (
            <TabsContent value="fit">
              {!hasRadarData ? (
                <NoData message="Add at least 2 programs and load fit scores to see the radar chart." />
              ) : (
                <ResponsiveContainer width="100%" height={340}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    {programs.map((p, i) => (
                      <Radar
                        key={String(p._id)}
                        name={shortName(p.name)}
                        dataKey={String(p._id)}
                        stroke={CHART_PALETTE[i % CHART_PALETTE.length]}
                        fill={CHART_PALETTE[i % CHART_PALETTE.length]}
                        fillOpacity={0.18}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Score']} />
                  </RadarChart>
                </ResponsiveContainer>
              )}
            </TabsContent>
          )}

          {/* ── Cost ──────────────────────────────────────────────────────── */}
          <TabsContent value="cost">
            {!hasCostData ? (
              <NoData message="No tuition data available." />
            ) : mode === 'programs' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={costData}
                  margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()} AUD`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Annual Tuition" fill={CHART_PALETTE[0]} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Total Cost" fill={CHART_PALETTE[1]} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={costData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 11 }}
                    width={56}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [`$${Number(v).toLocaleString()} AUD`, '']}
                  />
                  <Bar dataKey="Avg. Tuition" radius={[5, 5, 0, 0]}>
                    {costData.map((entry, i) => (
                      <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          {/* ── Rankings ──────────────────────────────────────────────────── */}
          <TabsContent value="rankings">
            {!hasRankData ? (
              <NoData message="No ranking data available for these institutions." />
            ) : (
              <div>
                <p className="text-xs text-slate-400 mb-3 text-center">Lower bar = better ranking (rank #1 is at the top)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rankData} margin={{ top: 8, right: 24, left: 16, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis
                      reversed
                      domain={[0, 1300]}
                      tickFormatter={(v) => v === 0 ? '' : `#${v}`}
                      tick={{ fontSize: 11 }}
                      width={48}
                      label={{ value: 'Global Rank', angle: -90, position: 'insideLeft', offset: -4, style: { fontSize: 10, fill: '#94a3b8' } }}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(v: any) => v > 0 ? [`Rank #${v}`, 'Global Rank'] : ['Unranked', 'Global Rank']}
                    />
                    <Bar dataKey="rank" radius={[5, 5, 0, 0]}>
                      {rankData.map((entry, i) => (
                        <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* ── Outcomes ──────────────────────────────────────────────────── */}
          <TabsContent value="outcomes">
            {!hasOutcomesData ? (
              <NoData message="No outcome data available for these institutions." />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={outcomesData}
                  margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
                  barGap={3}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} width={40} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [`${v}%`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Employment" name="Graduate Employment" fill={CHART_PALETTE[0]} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Teaching" name="Teaching Quality" fill={CHART_PALETTE[1]} radius={[5, 5, 0, 0]} />
                  <Bar dataKey="Support" name="Student Support" fill={CHART_PALETTE[2]} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
