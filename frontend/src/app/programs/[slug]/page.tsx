'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock, DollarSign, Globe, BookOpen, ChevronRight, CheckCircle2,
  Calendar, Monitor, GraduationCap, ExternalLink, AlertTriangle,
  Languages, Briefcase, FlaskConical, Layers, BadgeCheck,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

const levelColors: Record<string, string> = {
  bachelor: 'bg-primary-100 text-primary-800',
  master: 'bg-secondary-100 text-secondary-800',
  phd: 'bg-rose-100 text-rose-800',
  diploma: 'bg-amber-100 text-amber-800',
  certificate: 'bg-green-100 text-green-800',
  graduate_certificate: 'bg-teal-100 text-teal-800',
  secondary: 'bg-sky-100 text-sky-800',
  elicos: 'bg-violet-100 text-violet-800',
  non_award: 'bg-slate-100 text-slate-800',
  other: 'bg-slate-100 text-slate-800',
};

const levelLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  graduate_certificate: 'Graduate Certificate',
  secondary: 'Secondary',
  elicos: 'ELICOS',
  non_award: 'Non-Award',
  other: 'Other',
};

function fmt(n: number | undefined) {
  if (!n) return null;
  return `$${n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
      <div>
        <dt className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}

export default function ProgramDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data, isLoading } = useQuery({
    queryKey: ['program', slug],
    queryFn: () => programsApi.getBySlug(slug),
  });

  const program: Program | undefined = data?.data?.data;

  const hasCricosData = !!(program?.cricosProviderCode || program?.cricosCourseCode);
  const hasFeeData = !!(program?.tuitionFeeAud || program?.estimatedTotalCourseCostAud || program?.tuitionFeeLocal || program?.tuitionFeeInternational);
  const hasWorkComponent = program?.workComponent === 'Yes' || (program?.workComponentHoursPerWeek ?? 0) > 0;
  const hasFoE2 = !!(program?.fieldOfEducation2BroadField);

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
        <div className="bg-gradient-to-br from-secondary-900 via-primary/90 to-slate-900 text-white py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-40 bg-white/10" />
                <Skeleton className="h-10 w-96 bg-white/10" />
                <Skeleton className="h-5 w-56 bg-white/10" />
              </div>
            ) : program ? (
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${levelColors[program.level] ?? levelColors.other}`}>
                      {levelLabels[program.level] ?? program.level}
                    </span>
                    {program.expired && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide bg-red-500/20 text-red-300 border border-red-500/30">
                        <AlertTriangle className="h-3 w-3" /> Expired
                      </span>
                    )}
                    {program.courseLevel && (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-white/10 text-white/80">
                        {program.courseLevel}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold font-display mb-2">{program.name}</h1>
                  <Link
                    href={`/universities/${program.universitySlug}`}
                    className="text-white/70 hover:text-white transition-colors text-sm flex items-center gap-1"
                  >
                    <GraduationCap className="h-4 w-4" />
                    {program.universityName}
                    {program.institutionName && program.institutionName !== program.universityName && (
                      <span className="ml-1 text-white/50">({program.institutionName})</span>
                    )}
                  </Link>
                </div>
                {hasCricosData && (
                  <div className="text-right text-white/60 text-xs space-y-0.5">
                    {program.cricosProviderCode && <div>Provider: <span className="font-mono text-white/80">{program.cricosProviderCode}</span></div>}
                    {program.cricosCourseCode && <div>Course Code: <span className="font-mono text-white/80">{program.cricosCourseCode}</span></div>}
                    {program.vetNationalCode && <div>VET: <span className="font-mono text-white/80">{program.vetNationalCode}</span></div>}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            </div>
          ) : program ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              {/* ── Main column ─────────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-8">

                {/* Description / About */}
                <div>
                  <h2 className="text-xl font-bold font-display mb-3">About this Program</h2>
                  {program.description ? (
                    <p className="text-muted-foreground leading-relaxed">{program.description}</p>
                  ) : (
                    <p className="text-muted-foreground leading-relaxed">
                      {program.courseLevel ? `${program.courseLevel} programme` : 'This programme'} at {program.universityName},
                      registered with CRICOS{program.cricosProviderCode ? ` under provider code ${program.cricosProviderCode}` : ''}.
                      {program.durationWeeks ? ` Total duration: ${program.durationWeeks} weeks.` : ''}
                      {program.courseLanguage ? ` Delivered in ${program.courseLanguage}.` : ''}
                    </p>
                  )}
                </div>

                {/* Field of Education */}
                {(program.fieldOfEducation1BroadField || program.fieldOfStudy) && (
                  <div>
                    <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" /> Field of Education
                    </h2>
                    <div className="space-y-3">
                      {/* FoE 1 */}
                      <div className="rounded-xl border border-border/60 bg-card p-4">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Primary Field</p>
                        <div className="flex flex-wrap gap-2">
                          {program.fieldOfEducation1BroadField && (
                            <Badge variant="secondary">{program.fieldOfEducation1BroadField}</Badge>
                          )}
                          {program.fieldOfEducation1NarrowField && (
                            <Badge variant="outline" className="text-xs">{program.fieldOfEducation1NarrowField}</Badge>
                          )}
                          {program.fieldOfEducation1DetailedField && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">{program.fieldOfEducation1DetailedField}</Badge>
                          )}
                        </div>
                      </div>
                      {/* FoE 2 */}
                      {hasFoE2 && (
                        <div className="rounded-xl border border-border/60 bg-card p-4">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-semibold">Secondary Field</p>
                          <div className="flex flex-wrap gap-2">
                            {program.fieldOfEducation2BroadField && (
                              <Badge variant="secondary">{program.fieldOfEducation2BroadField}</Badge>
                            )}
                            {program.fieldOfEducation2NarrowField && (
                              <Badge variant="outline" className="text-xs">{program.fieldOfEducation2NarrowField}</Badge>
                            )}
                            {program.fieldOfEducation2DetailedField && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">{program.fieldOfEducation2DetailedField}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fees breakdown */}
                {hasFeeData && (
                  <div>
                    <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" /> Course Fees (AUD)
                    </h2>
                    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody className="divide-y divide-border/40">
                          {program.tuitionFeeAud != null && (
                            <tr className="px-4 py-3 flex items-center justify-between">
                              <td className="px-4 py-3 text-muted-foreground">Tuition Fee</td>
                              <td className="px-4 py-3 font-semibold text-right">{fmt(program.tuitionFeeAud)}</td>
                            </tr>
                          )}
                          {program.nonTuitionFeeAud != null && (
                            <tr className="px-4 py-3 flex items-center justify-between">
                              <td className="px-4 py-3 text-muted-foreground">Non-Tuition Fee</td>
                              <td className="px-4 py-3 font-semibold text-right">{fmt(program.nonTuitionFeeAud)}</td>
                            </tr>
                          )}
                          {program.estimatedTotalCourseCostAud != null && (
                            <tr className="px-4 py-3 flex items-center justify-between bg-primary/5">
                              <td className="px-4 py-3 font-semibold">Estimated Total Course Cost</td>
                              <td className="px-4 py-3 font-bold text-primary text-right">{fmt(program.estimatedTotalCourseCostAud)}</td>
                            </tr>
                          )}
                          {!program.tuitionFeeAud && program.tuitionFeeInternational && (
                            <tr className="px-4 py-3 flex items-center justify-between">
                              <td className="px-4 py-3 text-muted-foreground">International Fees</td>
                              <td className="px-4 py-3 font-semibold text-right">{fmt(program.tuitionFeeInternational)} / yr</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Work Integrated Learning */}
                {hasWorkComponent && (
                  <div>
                    <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" /> Work Integrated Learning
                    </h2>
                    <div className="rounded-xl border border-border/60 bg-card p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {program.workComponentHoursPerWeek != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Hours / Week</p>
                          <p className="text-sm font-semibold">{program.workComponentHoursPerWeek} hrs</p>
                        </div>
                      )}
                      {program.workComponentWeeks != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Weeks</p>
                          <p className="text-sm font-semibold">{program.workComponentWeeks} wks</p>
                        </div>
                      )}
                      {program.workComponentTotalHours != null && (
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total Hours</p>
                          <p className="text-sm font-semibold">{program.workComponentTotalHours} hrs</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                {/* CRICOS Data Source note */}
                {hasCricosData && program.dataQuality?.sourceName && (
                  <div className="rounded-xl border border-border/40 bg-muted/20 p-4 flex items-start gap-3">
                    <BadgeCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      Data sourced from <span className="text-foreground font-medium">{program.dataQuality.sourceName}</span>.
                      {program.dataQuality.lastFetchedAt && (
                        <> Last synced {new Date(program.dataQuality.lastFetchedAt).toLocaleDateString('en-AU')}.</>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Sidebar ──────────────────────────────────────────────── */}
              <aside className="space-y-5">

                {/* Quick Facts */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <h3 className="font-semibold mb-4">Program Details</h3>
                  <dl className="space-y-4">
                    <DetailRow icon={Clock} label="Duration"
                      value={program.durationWeeks
                        ? `${program.durationWeeks} weeks`
                        : program.duration || null} />
                    <DetailRow icon={Monitor} label="Campus Mode"
                      value={program.campusMode ? <span className="capitalize">{program.campusMode.replace('-', ' ')}</span> : null} />
                    <DetailRow icon={Languages} label="Language" value={program.courseLanguage ?? null} />
                    {program.intakeMonths && program.intakeMonths.length > 0 && (
                      <DetailRow icon={Calendar} label="Intake" value={program.intakeMonths.join(', ')} />
                    )}
                    <DetailRow icon={DollarSign} label="Tuition Fee (total)"
                      value={fmt(program.estimatedTotalCourseCostAud) ?? fmt(program.tuitionFeeInternational ?? undefined)} />
                    {program.cricosCourseCode && (
                      <DetailRow icon={CheckCircle2} label="CRICOS Code" value={<span className="font-mono">{program.cricosCourseCode}</span>} />
                    )}
                    {program.vetNationalCode && (
                      <DetailRow icon={FlaskConical} label="VET Code" value={<span className="font-mono">{program.vetNationalCode}</span>} />
                    )}
                    {program.dualQualification && (
                      <DetailRow icon={CheckCircle2} label="Dual Qualification" value="Yes" />
                    )}
                    {program.foundationStudies && (
                      <DetailRow icon={CheckCircle2} label="Foundation Studies" value="Yes" />
                    )}
                  </dl>
                </div>

                {/* Field badge */}
                {(program.field || program.fieldOfEducation1BroadField) && (
                  <div className="rounded-xl border border-border/60 bg-card p-5">
                    <p className="text-xs text-muted-foreground mb-2">Field of Study</p>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {program.fieldOfEducation1BroadField ?? program.field}
                    </Badge>
                  </div>
                )}

                {/* Links */}
                {program.website && (
                  <a href={program.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-card p-4 text-sm font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    View on University Site
                  </a>
                )}

                {program.cricosCourseCode && (
                  <a
                    href={`https://cricos.education.gov.au/course/coursedetails.aspx?coursecode=${program.cricosCourseCode}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium hover:bg-primary/10 transition-colors text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Official CRICOS Page
                  </a>
                )}

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
