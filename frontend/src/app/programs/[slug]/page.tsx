'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Clock, DollarSign, Globe, BookOpen, ChevronRight, CheckCircle2, Calendar, Monitor, GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

const levelColors: Record<string, string> = {
  bachelor: 'bg-blue-100 text-blue-800',
  master: 'bg-violet-100 text-violet-800',
  phd: 'bg-rose-100 text-rose-800',
  diploma: 'bg-amber-100 text-amber-800',
  certificate: 'bg-green-100 text-green-800',
  graduate_certificate: 'bg-teal-100 text-teal-800',
};

const levelLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  graduate_certificate: 'Graduate Certificate',
};

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => programsApi.getBySlug(slug),
  });

  const program: Program | undefined = data?.data?.data;

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="border-b border-border/60 bg-muted/30">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/programs" className="hover:text-foreground">Programs</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{program?.name || '...'}</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="bg-gradient-to-br from-violet-900 via-primary/90 to-slate-900 text-white py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40 bg-white/10" />
                <Skeleton className="h-10 w-96 bg-white/10" />
                <Skeleton className="h-5 w-56 bg-white/10" />
              </div>
            ) : program ? (
              <div>
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide mb-4 ${levelColors[program.level]}`}>
                  {levelLabels[program.level]}
                </span>
                <h1 className="text-3xl font-bold font-display mb-2">{program.name}</h1>
                <Link
                  href={`/universities/${program.universitySlug}`}
                  className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
                >
                  <GraduationCap className="h-4 w-4" />
                  {program.universityName}
                </Link>
              </div>
            ) : null}
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ) : program ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main */}
              <div className="lg:col-span-2 space-y-8">
                {/* Description */}
                <div>
                  <h2 className="text-xl font-bold font-display mb-3">About this Program</h2>
                  <p className="text-muted-foreground leading-relaxed">{program.description}</p>
                </div>

                {/* Requirements */}
                {(program.academicRequirements || program.englishRequirements) && (
                  <div>
                    <h2 className="text-xl font-bold font-display mb-4">Entry Requirements</h2>
                    <div className="space-y-3">
                      {program.academicRequirements && (
                        <div className="flex gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                          <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Academic</p>
                            <p className="text-sm">{program.academicRequirements}</p>
                          </div>
                        </div>
                      )}
                      {program.englishRequirements && (
                        <div className="flex gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                          <Globe className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">English</p>
                            <p className="text-sm">{program.englishRequirements}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Career Pathways */}
                {program.careerPathways && program.careerPathways.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold font-display mb-4">Career Pathways</h2>
                    <div className="flex flex-wrap gap-2">
                      {program.careerPathways.map((career) => (
                        <div key={career} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {career}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="space-y-5">
                {/* Quick Facts */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <h3 className="font-semibold mb-4">Program Details</h3>
                  <dl className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">Duration</dt>
                        <dd className="text-sm font-medium">{program.duration}</dd>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Monitor className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div>
                        <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">Campus Mode</dt>
                        <dd className="text-sm font-medium capitalize">{program.campusMode}</dd>
                      </div>
                    </div>
                    {program.intakeMonths && program.intakeMonths.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">Intake</dt>
                          <dd className="text-sm font-medium">{program.intakeMonths.join(', ')}</dd>
                        </div>
                      </div>
                    )}
                    {program.tuitionFeeLocal && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">Domestic Fees</dt>
                          <dd className="text-sm font-medium">${program.tuitionFeeLocal.toLocaleString()} / yr</dd>
                        </div>
                      </div>
                    )}
                    {program.tuitionFeeInternational && (
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div>
                          <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">International Fees</dt>
                          <dd className="text-sm font-medium">${program.tuitionFeeInternational.toLocaleString()} / yr</dd>
                        </div>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Field badge */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <p className="text-xs text-muted-foreground mb-2">Field of Study</p>
                  <Badge variant="secondary" className="text-sm px-3 py-1">{program.field}</Badge>
                </div>

                {/* Official link */}
                {program.website && (
                  <a
                    href={program.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-card p-4 text-sm font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    View on University Site
                  </a>
                )}

                {/* University link */}
                <Link href={`/universities/${program.universitySlug}`}>
                  <div className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-card p-4 text-sm font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    View University
                  </div>
                </Link>
              </aside>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
