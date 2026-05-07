'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, Info, MapPin, GraduationCap, DollarSign, Languages, Calendar, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from 'recharts';
import { buildRadarData, CHART_PALETTE, shortName } from '@/lib/chartHelpers';
import { FitScoreResult } from '@/types/api';

interface ComparisonRow {
  label: string;
  icon: any;
  key: string;
  formatter?: (val: any) => string;
}

const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'University', icon: GraduationCap, key: 'university.name' },
  { label: 'State', icon: MapPin, key: 'university.state' },
  { label: 'Intake', icon: Calendar, key: 'intakeMonths', formatter: (val) => Array.isArray(val) ? val.join(', ') : val },
  { label: 'Tuition (AUD/yr)', icon: DollarSign, key: 'annualTuition', formatter: (val) => val ? `$${val.toLocaleString()}` : 'N/A' },
  { label: 'IELTS Required', icon: Languages, key: 'ieltsRequirement', formatter: (val) => val ? val.toString() : '6.5' },
];

const BREAKDOWN_LABELS: Record<string, string> = {
  affordability: 'Affordability',
  ranking: 'Ranking',
  employability: 'Employability',
  admissionMatch: 'Admission',
  location: 'Location',
  scholarship: 'Scholarship',
};

const tooltipStyle = {
  borderRadius: '10px',
  border: 'none',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  fontSize: 12,
};

export default function ComparePage() {
  const { hash } = useParams<{ hash: string }>();
  const { removeFromCompare } = useComparison();

  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['comparison', hash],
    queryFn: () => api.get(`/comparison/${hash}`).then(r => r.data),
  });

  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['comparison-scores', hash],
    queryFn: () => api.get(`/comparison/${hash}/scores`).then(r => r.data),
  });

  const session = sessionData?.data;
  const scores: FitScoreResult[] = scoresData?.data || [];
  const programs = session?.selectedProgramIds || [];

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
  };

  const radarData = buildRadarData(programs, scores);
  const hasRadar = scores.length >= 2 && programs.length >= 2;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12">
        <div className="mb-10">
          <Badge variant="outline" className="mb-3 border-primary/30 text-primary bg-primary/5">Deep Comparison</Badge>
          <h1 className="text-4xl font-black font-display tracking-tight text-slate-900">Program Comparison</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Side-by-side analysis of your selected programs with personalized fit scores based on your profile.
          </p>
        </div>

        {isLoadingSession || isLoadingScores ? (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-2xl" />
            <Skeleton className="h-[400px] w-full rounded-2xl" />
          </div>
        ) : !session || programs.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Info className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-xl font-medium text-slate-600">No programs selected for comparison.</p>
            <p className="text-sm text-slate-400 mt-1">Add programs from the search page to compare them here.</p>
          </div>
        ) : (
          <>
            {/* Radar Overview Card */}
            {hasRadar && (
              <Card className="mb-6 border-slate-100 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold text-slate-700">Fit Score Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData} margin={{ top: 10, right: 40, bottom: 10, left: 40 }}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      {programs.map((p: any, i: number) => (
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
                </CardContent>
              </Card>
            )}

            {/* Comparison Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="p-8 text-left border-b border-slate-200 min-w-60">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Comparing</span>
                          <span className="text-2xl font-bold text-slate-900">{programs.length} Programs</span>
                        </div>
                      </th>
                      {programs.map((program: any) => {
                        const score = scores.find((s) => s.programId === program._id);
                        return (
                          <th key={program._id} className="p-8 border-b border-l border-slate-100 min-w-75">
                            <div className="space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="flex gap-4 items-start">
                                  <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                    {program.university?.logo ? (
                                      <img src={program.university.logo} alt="" className="w-8 h-8 object-contain" />
                                    ) : (
                                      <GraduationCap className="h-6 w-6 text-slate-400" />
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => removeFromCompare(program._id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                {score && (
                                  <div className="text-right">
                                    <div className={`text-3xl font-black ${score.totalScore > 80 ? 'text-emerald-500' : score.totalScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                                      {score.totalScore}%
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Fit Score</div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-slate-900 leading-tight text-left line-clamp-2 min-h-14">
                                  {program.name}
                                </h3>
                                <p className="text-sm text-slate-500 text-left mt-1">{program.universityName}</p>
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Fit Breakdown Row — recharts horizontal bar chart */}
                    <tr className="bg-primary/5">
                      <td className="p-6 border-b border-slate-200 font-bold text-slate-900 text-sm align-top">
                        Personalized Fit Breakdown
                      </td>
                      {programs.map((program: any) => {
                        const score = scores.find((s) => s.programId === program._id);
                        const chartData = score
                          ? Object.entries(score.breakdown).map(([key, val]) => ({
                              name: BREAKDOWN_LABELS[key] ?? key,
                              value: val as number,
                            }))
                          : [];
                        return (
                          <td key={program._id} className="p-6 border-b border-slate-200 border-l border-slate-100">
                            {score ? (
                              <ResponsiveContainer width="100%" height={210}>
                                <BarChart
                                  data={chartData}
                                  layout="vertical"
                                  margin={{ left: 72, right: 12, top: 4, bottom: 4 }}
                                >
                                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
                                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={72} />
                                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v}%`, 'Score']} />
                                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {chartData.map((entry, i) => (
                                      <Cell
                                        key={i}
                                        fill={entry.value > 80 ? '#90AB8B' : entry.value > 50 ? '#B8C9A3' : '#ef4444'}
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Loading scores…</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Reasons Row */}
                    <tr>
                      <td className="p-6 border-b border-slate-200 font-bold text-slate-900 text-sm align-top">
                        Why it fits you
                      </td>
                      {programs.map((program: any) => {
                        const score = scores.find((s) => s.programId === program._id);
                        return (
                          <td key={program._id} className="p-6 border-b border-slate-200 border-l border-slate-100 align-top">
                            <div className="space-y-2">
                              {score?.reasons?.map((r: string, i: number) => (
                                <div key={i} className="flex gap-2 text-xs text-slate-600 leading-snug">
                                  {r.includes('exceeds') || r.includes('below') || r.includes('may not') ? (
                                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  )}
                                  <span>{r}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Detail Rows */}
                    {COMPARISON_ROWS.map((row) => (
                      <tr key={row.key} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="p-6 border-b border-slate-200 text-sm font-medium text-slate-500">
                          <div className="flex items-center gap-3">
                            <row.icon className="h-4 w-4 text-slate-400" />
                            {row.label}
                          </div>
                        </td>
                        {programs.map((program: any) => {
                          const val = getNestedValue(program, row.key);
                          const formatted = row.formatter ? row.formatter(val) : val;
                          return (
                            <td key={program._id} className="p-6 border-b border-l border-slate-100 text-sm text-slate-900 font-semibold">
                              {formatted || '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
