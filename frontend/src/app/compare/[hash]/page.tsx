'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import api from '@/lib/api';

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 container mx-auto max-w-7xl px-4 py-12">
        <h1 className="text-3xl font-bold font-display mb-2">Compare Programs</h1>
        <p className="text-slate-500 mb-8">
          Detailed fit-score analysis based on your personal profile and preferences.
        </p>

        {isLoadingSession || isLoadingScores ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-[400px] rounded-xl" />
          </div>
        ) : !session || session.selectedProgramIds.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-xl border border-slate-200">
            <Info className="h-10 w-10 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-500">No programs selected for comparison.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {session.selectedProgramIds.map((program: any) => {
              const score = scores.find((s: any) => s.programId === program._id);
              
              return (
                <div key={program._id} className="flex flex-col gap-4">
                  <ProgramCard program={program} />
                  
                  {score && (
                    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <h4 className="font-semibold text-slate-800">Fit Score</h4>
                        <span className={`text-xl font-bold ${score.totalScore > 80 ? 'text-emerald-500' : score.totalScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {score.totalScore}%
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Affordability</span>
                          <span className="font-medium">{score.breakdown.affordability}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Admission</span>
                          <span className="font-medium">{score.breakdown.admissionMatch}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Location</span>
                          <span className="font-medium">{score.breakdown.location}%</span>
                        </div>
                      </div>

                      {score.reasons && score.reasons.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-600 space-y-1">
                          {score.reasons.map((r: string, i: number) => (
                            <div key={i} className="flex gap-2">
                              {r.includes('exceeds') || r.includes('below') ? (
                                <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                              <span>{r}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
