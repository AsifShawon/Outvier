'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, Info, MapPin, GraduationCap, DollarSign, Languages, Calendar } from 'lucide-react';
import api from '@/lib/api';

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

export default function ComparePage() {
  const { hash } = useParams<{ hash: string }>();

  const { data: sessionData, isLoading: isLoadingSession } = useQuery({
    queryKey: ['comparison', hash],
    queryFn: () => api.get(`/comparison/${hash}`).then(r => r.data),
  });

  const { data: scoresData, isLoading: isLoadingScores } = useQuery({
    queryKey: ['comparison-scores', hash],
    queryFn: () => api.get(`/comparison/${hash}/scores`).then(r => r.data),
  });

  const session = sessionData?.data;
  const scores = scoresData?.data || [];
  const programs = session?.selectedProgramIds || [];

  const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

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
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="p-8 text-left border-b border-slate-200 min-w-[240px]">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Comparing</span>
                        <span className="text-2xl font-bold text-slate-900">{programs.length} Programs</span>
                      </div>
                    </th>
                    {programs.map((program: any) => {
                      const score = scores.find((s: any) => s.programId === program._id);
                      return (
                        <th key={program._id} className="p-8 border-b border-slate-200 border-l border-slate-100 min-w-[300px]">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div className="h-12 w-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden">
                                {program.university?.logo ? (
                                  <img src={program.university.logo} alt="" className="w-8 h-8 object-contain" />
                                ) : (
                                  <GraduationCap className="h-6 w-6 text-slate-400" />
                                )}
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
                              <h3 className="text-lg font-bold text-slate-900 leading-tight text-left line-clamp-2 min-h-[3.5rem]">
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
                  {/* Fit Breakdown Row */}
                  <tr className="bg-primary/5">
                    <td className="p-6 border-b border-slate-200 font-bold text-slate-900 text-sm">
                      Personalized Fit Breakdown
                    </td>
                    {programs.map((program: any) => {
                      const score = scores.find((s: any) => s.programId === program._id);
                      return (
                        <td key={program._id} className="p-6 border-b border-slate-200 border-l border-slate-100">
                          {score && (
                            <div className="space-y-3">
                              {Object.entries(score.breakdown).map(([key, val]: [string, any]) => (
                                <div key={key} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                    <span>{key}</span>
                                    <span>{val}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full transition-all duration-500 ${val > 80 ? 'bg-emerald-400' : val > 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                                      style={{ width: `${val}%` }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
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
                      const score = scores.find((s: any) => s.programId === program._id);
                      return (
                        <td key={program._id} className="p-6 border-b border-slate-200 border-l border-slate-100 align-top">
                          <div className="space-y-2">
                            {score?.reasons?.map((r: string, i: number) => (
                              <div key={i} className="flex gap-2 text-xs text-slate-600 leading-snug">
                                {r.includes('exceeds') || r.includes('below') ? (
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
                          <td key={program._id} className="p-6 border-b border-slate-200 border-l border-slate-100 text-sm text-slate-900 font-semibold">
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
        )}
      </main>
      <Footer />
    </div>
  );
}
