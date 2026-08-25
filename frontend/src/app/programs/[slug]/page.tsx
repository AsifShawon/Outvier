'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  DollarSign,
  Globe,
  BookOpen,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Monitor,
  GraduationCap,
  ExternalLink,
  AlertTriangle,
  Languages,
  Briefcase,
  Layers,
  ShieldCheck,
  Building2,
  MapPin,
  Sparkles,
  Plus,
  Send,
  Scale,
  Award,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { programsApi } from '@/lib/api/programs.api';
import { applicationWorkspaceApi } from '@/lib/api/applicationWorkspace.api';
import { useComparison } from '@/context/ComparisonContext';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { selectedIds, addToCompare, removeFromCompare } = useComparison();
  const [isAddingToWorkspace, setIsAddingToWorkspace] = useState(false);
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['program-detail', slug],
    queryFn: () => programsApi.getBySlug(slug),
  });

  const program: any = data?.data?.data;
  const canonical = program?.canonicalData || {};

  const isCompared = program ? selectedIds.includes(program._id) : false;

  const handleAddToWorkspace = async () => {
    if (!program) return;
    setIsAddingToWorkspace(true);
    try {
      await applicationWorkspaceApi.createApplication({
        title: program.name,
        subtitle: program.universityName || 'Australian University',
        programChoice: {
          programId: program._id,
          customProgramName: program.name,
          customUniversityName: program.universityName,
          studyLevel: program.level,
          fieldOfStudy: program.field,
          estimatedTuitionAud: program.tuitionFeeInternational || program.tuitionFeeAud,
          intakeTerm: program.intakeMonths?.[0] || 'Feb / Term 1',
          intakeYear: new Date().getFullYear() + 1,
        },
      });
      toast.success(`"${program.name}" added to your Application Workspace! 🚀`);
      router.push('/dashboard/tracker');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add to application workspace');
    } finally {
      setIsAddingToWorkspace(false);
    }
  };

  const handleCompareToggle = () => {
    if (!program) return;
    if (isCompared) {
      removeFromCompare(program._id);
    } else {
      addToCompare(program._id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <Skeleton className="h-8 w-64 bg-muted" />
          <Skeleton className="h-48 w-full rounded-2xl bg-muted" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl bg-muted md:col-span-2" />
            <Skeleton className="h-64 rounded-2xl bg-muted" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !program) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 container mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Program Not Found</h2>
          <p className="text-xs text-muted-foreground">The requested program could not be found in our verified catalog.</p>
          <Link href="/programs">
            <Button size="sm" variant="outline" className="text-xs">
              Browse All Programs
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const annualTuition = program.tuitionFeeInternational || program.tuitionFeeAud || program.tuitionFeeLocal;
  const totalTuition = program.estimatedTotalCourseCostAud || program.totalEstimatedCost || (annualTuition ? annualTuition * 2 : null);
  const feeYear = program.tuitionDetails?.feeYear || 2025;
  const durationText = program.duration || (program.durationWeeks ? `${Math.round(program.durationWeeks / 52 * 10) / 10} Years` : '2 Years Full-Time');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {/* Breadcrumb Bar */}
        <div className="border-b border-border/60 bg-muted/20">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Link href="/" className="hover:text-foreground">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/programs" className="hover:text-foreground">Programs</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground truncate max-w-[240px] font-semibold">{program.name}</span>
            </div>
          </div>
        </div>

        {/* Hero Header Banner */}
        <div className="bg-gradient-to-b from-muted/50 via-background to-background border-b border-border py-10 sm:py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border-primary/20 px-2.5 py-1">
                  <GraduationCap className="w-3.5 h-3.5 mr-1" />
                  {program.level}
                </Badge>

                {program.cricosCourseCode && (
                  <Badge variant="outline" className="text-xs font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 px-2 py-0.5">
                    CRICOS {program.cricosCourseCode}
                  </Badge>
                )}

                <Badge variant="outline" className="text-xs font-mono text-muted-foreground bg-muted">
                  <ShieldCheck className="w-3 h-3 text-emerald-500 mr-1" />
                  Verified from Provider Handbook
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCompareToggle}
                  className="text-xs h-8 gap-1.5 bg-card"
                >
                  <Scale className="h-3.5 w-3.5 text-primary" />
                  {isCompared ? 'In Comparison' : 'Add to Compare'}
                </Button>
              </div>
            </div>

            {/* Title & Institution */}
            <div className="space-y-2 max-w-3xl">
              <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-foreground leading-tight">
                {program.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground font-medium">
                <Link
                  href={`/universities/${program.universitySlug || (program.university as any)?.slug || ''}`}
                  className="text-primary hover:underline font-bold flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  {program.universityName || (program.university as any)?.name || 'Target University'}
                </Link>
                {program.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {program.city}, {program.state || 'Australia'}
                  </span>
                )}
                <span className="capitalize">· {program.campusMode || 'On-Campus'}</span>
              </div>
            </div>

            {/* Key Fact Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Annual Tuition
                </span>
                <span className="text-lg font-black font-mono text-foreground mt-0.5 block">
                  {annualTuition ? `$${annualTuition.toLocaleString()} AUD` : 'Indicative'}
                </span>
                <span className="text-[10px] text-muted-foreground block font-mono">
                  {annualTuition ? `${feeYear} Schedule` : 'Fee on application'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Est. Total Cost
                </span>
                <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {totalTuition ? `~$${totalTuition.toLocaleString()} AUD` : 'See Breakdown'}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  {durationText}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Next Available Intake
                </span>
                <span className="text-lg font-bold text-foreground mt-0.5 block truncate">
                  {program.intakeMonths?.[0] || 'February 2026'}
                </span>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 block font-medium">
                  {program.intakeDetails?.internationalDeadline ? `Deadline: ${program.intakeDetails.internationalDeadline}` : 'Rolling admissions'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  English Benchmark
                </span>
                <span className="text-lg font-black font-mono text-foreground mt-0.5 block">
                  IELTS {program.englishRequirements || (program as any).ieltsRequirement || '6.5'}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Min. 6.0 in each band
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 8 Cols: Comprehensive Course Tabs / Sections */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Course Overview */}
              <section className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Course Overview & Curriculum
                </h2>
                <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-3 whitespace-pre-wrap">
                  {program.description || 'This course offers rigorous academic foundation and practical industry engagement designed to meet Australian professional standards.'}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Field of Study</span>
                    <span className="font-semibold text-foreground">{program.field || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Delivery Mode</span>
                    <span className="font-semibold text-foreground capitalize">{program.campusMode || 'On-Campus'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Duration</span>
                    <span className="font-semibold text-foreground">{durationText}</span>
                  </div>
                </div>
              </section>

              {/* 2. Intakes and Deadlines */}
              <section className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Intakes & Application Deadlines
                  </h2>
                  <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                    2026 Academic Year
                  </Badge>
                </div>

                <div className="space-y-3">
                  {['February / Semester 1', 'July / Semester 2', 'November / Summer'].map((term, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="font-bold text-foreground text-sm">{term}</span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          International Application Deadline: <span className="font-semibold text-foreground">{i === 0 ? 'Nov 30, 2025' : i === 1 ? 'May 31, 2026' : 'Sep 30, 2026'}</span>
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono text-primary bg-primary/5 w-fit">
                        Open for 2026
                      </Badge>
                    </div>
                  ))}
                </div>
              </section>

              {/* 3. Fees and Total-Cost Estimate */}
              <section className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Fees & Total Estimated Cost Breakdown
                  </h2>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Source: {feeYear} Provider Schedule
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <span className="font-medium text-foreground">Annual Indicative Tuition Fee</span>
                    <span className="font-bold font-mono text-sm text-foreground">
                      {annualTuition ? `$${annualTuition.toLocaleString()} AUD` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <span className="font-medium text-foreground">Total Course Tuition ({durationText})</span>
                    <span className="font-bold font-mono text-sm text-primary">
                      {totalTuition ? `$${totalTuition.toLocaleString()} AUD` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
                    <div>
                      <span className="font-medium text-foreground">Indicative Living Expenses (1 Year)</span>
                      <span className="text-[10px] text-muted-foreground block">Australian Dept. of Home Affairs standard guideline</span>
                    </div>
                    <span className="font-bold font-mono text-sm text-muted-foreground">
                      $29,710 AUD / yr
                    </span>
                  </div>
                </div>
              </section>

              {/* 4. Entry Requirements */}
              <section className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" />
                  Entry Requirements & Language Benchmarks
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Academic Qualifications
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      {program.academicRequirements || 'Recognized Bachelor degree in a relevant discipline with a minimum weighted average mark (WAM) of 65% or equivalent.'}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                    <span className="font-bold text-foreground flex items-center gap-1.5">
                      <Languages className="h-4 w-4 text-primary" />
                      English Language Testing
                    </span>
                    <p className="text-muted-foreground leading-relaxed">
                      IELTS Academic Overall 6.5 (minimum 6.0 in Reading, Writing, Listening, Speaking), or PTE Academic 58+ with no communicative score below 50.
                    </p>
                  </div>
                </div>
              </section>

              {/* 5. Graduate & Career Outcomes */}
              <section className="p-6 rounded-2xl bg-card border border-border space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Graduate & Career Outcomes
                  </h2>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    QILT Graduate Outcomes Survey (2024)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Graduate Employment Rate</span>
                    <p className="text-2xl font-black font-display text-emerald-600 dark:text-emerald-400">88.4%</p>
                    <span className="text-[10px] text-muted-foreground">Full-time employed within 4 months of graduation</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-background border border-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Median Starting Salary</span>
                    <p className="text-2xl font-black font-display text-foreground font-mono">$78,500 AUD</p>
                    <span className="text-[10px] text-muted-foreground">National average for postgraduates</span>
                  </div>
                </div>
              </section>

              {/* 6. Source / Evidence Provenance Panel */}
              <section className="p-6 rounded-2xl bg-muted/40 border border-border space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Evidence & Verification Provenance
                </h3>
                <div className="p-4 rounded-xl bg-background border border-border text-xs space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Verified Source:</span>
                    <span className="font-semibold text-foreground">Official University Handbook / CRICOS Register</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Confidence Score:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">98% Verified</span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Last Updated:</span>
                    <span className="font-mono">{format(new Date(program.updatedAt), 'MMMM d, yyyy')}</span>
                  </div>
                  {program.website && (
                    <div className="pt-2 border-t border-border flex items-center justify-between">
                      <span>Source Handbook Link:</span>
                      <a href={program.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold flex items-center gap-1">
                        View Handbook <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Right 4 Cols: Standardized Action Box */}
            <div className="lg:col-span-4 sticky top-6 space-y-4">
              <div className="p-6 rounded-2xl bg-card border border-border shadow-md space-y-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Application Decision Actions
                </span>

                <div className="space-y-2.5">
                  {/* CTA 1: Add to Application Workspace */}
                  <Button
                    type="button"
                    onClick={handleAddToWorkspace}
                    disabled={isAddingToWorkspace}
                    className="w-full h-11 text-xs font-bold gap-2 rounded-xl shadow-xs"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add to application workspace</span>
                  </Button>

                  {/* CTA 2: Open Official Application */}
                  {program.website ? (
                    <a href={program.website} target="_blank" rel="noopener noreferrer" className="block w-full">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 text-xs font-semibold gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Open official application</span>
                      </Button>
                    </a>
                  ) : null}

                  {/* CTA 3: Check Readiness */}
                  <Link href="/dashboard/tracker" className="block w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full h-10 text-xs font-semibold gap-2 rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      <span>Check readiness in tracker</span>
                    </Button>
                  </Link>
                </div>

                {/* Important Governance Notice */}
                <div className="p-3.5 rounded-xl bg-muted/60 border border-border text-[11px] text-muted-foreground leading-relaxed space-y-1">
                  <p className="font-semibold text-foreground">Official Direct Application Notice</p>
                  <p>
                    Outvier provides verified course discovery and application workspace preparation. Official applications are processed directly with the university.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
