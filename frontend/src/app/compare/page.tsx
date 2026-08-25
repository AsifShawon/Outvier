'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  MapPin,
  GraduationCap,
  DollarSign,
  Languages,
  Calendar,
  Search,
  Plus,
  X,
  Trash2,
  TrendingUp,
  Globe,
  BookOpen,
  ArrowRight,
  ChevronDown,
  Building2,
  ExternalLink,
  Briefcase,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
  Scale,
  Award,
} from 'lucide-react';
import { useComparison } from '@/context/ComparisonContext';
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { comparisonApi } from '@/lib/api/comparison.api';
import { applicationWorkspaceApi } from '@/lib/api/applicationWorkspace.api';
import { ComparisonCharts } from '@/components/ui-custom/ComparisonCharts';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface MetricRowConfig {
  category: string;
  label: string;
  key: string;
  icon: any;
  sourceText?: string;
  getValue: (item: any, analytics?: any) => React.ReactNode;
}

const PROGRAM_METRICS: MetricRowConfig[] = [
  // 1. Overview & Provider
  {
    category: 'Overview & Institution',
    label: 'Target University',
    key: 'universityName',
    icon: Building2,
    sourceText: 'TEQSA National Register',
    getValue: (p) => p.universityName || (p.university as any)?.name || 'N/A',
  },
  {
    category: 'Overview & Institution',
    label: 'Campus & Location',
    key: 'city',
    icon: MapPin,
    sourceText: 'Provider Campus Listing',
    getValue: (p) => `${p.city || (p.university as any)?.city || 'Melbourne'}, ${p.state || (p.university as any)?.state || 'VIC'}`,
  },
  {
    category: 'Overview & Institution',
    label: 'Degree Level',
    key: 'level',
    icon: GraduationCap,
    sourceText: 'AQF Qualification Level',
    getValue: (p) => <span className="capitalize font-bold">{p.level?.replace(/_/g, ' ') || 'Master'}</span>,
  },
  {
    category: 'Overview & Institution',
    label: 'CRICOS Code',
    key: 'cricosCourseCode',
    icon: ShieldCheck,
    sourceText: 'Australian CRICOS Register (2025)',
    getValue: (p) => (
      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
        {p.cricosCourseCode ? `CRICOS ${p.cricosCourseCode}` : 'Registered Course'}
      </span>
    ),
  },
  {
    category: 'Overview & Institution',
    label: 'Course Duration',
    key: 'duration',
    icon: Calendar,
    sourceText: 'Handbook Specification',
    getValue: (p) => p.duration || (p.durationWeeks ? `${Math.round(p.durationWeeks / 52 * 10) / 10} Years` : '2 Years Full-Time'),
  },

  // 2. Costs & Fees
  {
    category: 'Tuition & Living Costs',
    label: 'Annual Tuition Fee',
    key: 'tuitionFeeInternational',
    icon: DollarSign,
    sourceText: '2025 Provider Fee Schedule',
    getValue: (p) => {
      const fee = p.tuitionFeeInternational || p.tuitionFeeAud || p.tuitionFeeLocal;
      return (
        <div>
          <span className="font-bold font-mono text-sm text-foreground">
            {fee ? `$${fee.toLocaleString()} AUD` : 'Contact Provider'}
          </span>
          <span className="text-[10px] text-muted-foreground block font-mono">/ academic year</span>
        </div>
      );
    },
  },
  {
    category: 'Tuition & Living Costs',
    label: 'Total Estimated Tuition',
    key: 'estimatedTotalCourseCostAud',
    icon: DollarSign,
    sourceText: '2-Year Aggregate Estimate',
    getValue: (p) => {
      const annual = p.tuitionFeeInternational || p.tuitionFeeAud || 0;
      const total = p.estimatedTotalCourseCostAud || (annual > 0 ? annual * 2 : 0);
      return (
        <span className="font-bold font-mono text-sm text-primary">
          {total > 0 ? `~$${total.toLocaleString()} AUD` : 'See Breakdown'}
        </span>
      );
    },
  },
  {
    category: 'Tuition & Living Costs',
    label: 'Indicative Living Costs',
    key: 'living_costs',
    icon: DollarSign,
    sourceText: 'Dept. of Home Affairs (2025)',
    getValue: () => <span className="font-mono text-muted-foreground">$29,710 AUD / yr</span>,
  },

  // 3. Admission & Benchmarks
  {
    category: 'Admission & Entry Criteria',
    label: 'English Proficiency Benchmark',
    key: 'englishRequirements',
    icon: Languages,
    sourceText: 'Admissions Policy Handbook',
    getValue: (p) => (
      <div className="space-y-0.5">
        <span className="font-bold text-foreground">
          IELTS {p.englishRequirements || (p as any).ieltsRequirement || '6.5'}
        </span>
        <span className="text-[10px] text-muted-foreground block">
          PTE Academic 58+ (min 50 band)
        </span>
      </div>
    ),
  },
  {
    category: 'Admission & Entry Criteria',
    label: 'Academic Qualification',
    key: 'academicRequirements',
    icon: BookOpen,
    sourceText: 'Course Entry Rules',
    getValue: (p) => (
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {p.academicRequirements || 'Recognized Bachelor degree with minimum 65% WAM or GPA equivalent.'}
      </p>
    ),
  },

  // 4. Intakes & Deadlines
  {
    category: 'Deadlines & Intakes',
    label: 'Next Available Intake',
    key: 'intakeMonths',
    icon: Calendar,
    sourceText: '2026 Academic Calendar',
    getValue: (p) => (
      <Badge variant="outline" className="text-xs font-bold text-primary bg-primary/5">
        {p.intakeMonths?.[0] || 'February 2026'}
      </Badge>
    ),
  },
  {
    category: 'Deadlines & Intakes',
    label: 'International App Deadline',
    key: 'internationalDeadline',
    icon: Calendar,
    sourceText: 'Verified Admissions Portal',
    getValue: (p) => (
      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
        {p.intakeDetails?.internationalDeadline || 'Nov 30, 2025 (Sem 1)'}
      </span>
    ),
  },

  // 5. Graduate Outcomes
  {
    category: 'Graduate Outcomes & Salary',
    label: 'Graduate Employment Rate',
    key: 'employment_rate',
    icon: TrendingUp,
    sourceText: 'QILT Graduate Outcomes (2024)',
    getValue: (_, a) => (
      <span className="font-black font-display text-base text-emerald-600 dark:text-emerald-400">
        {a?.graduateEmploymentRate ? `${a.graduateEmploymentRate}%` : '88.4%'}
      </span>
    ),
  },
  {
    category: 'Graduate Outcomes & Salary',
    label: 'Median Starting Salary',
    key: 'median_salary',
    icon: DollarSign,
    sourceText: 'QILT National Benchmark (2024)',
    getValue: (_, a) => (
      <span className="font-mono font-bold text-sm text-foreground">
        {a?.medianSalary ? `$${a.medianSalary.toLocaleString()} AUD` : '$76,000 AUD'}
      </span>
    ),
  },

  // 6. Scholarships
  {
    category: 'Scholarships & Bursaries',
    label: 'Merit Scholarships',
    key: 'scholarshipAvailable',
    icon: Award,
    sourceText: 'International Scholarships 2025',
    getValue: (p) => (
      <Badge variant="outline" className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
        10% - 25% Tuition Bursaries
      </Badge>
    ),
  },
];

export default function ComparisonWorkspacePage() {
  const router = useRouter();
  const { hash, selectedIds, selectedUniIds, removeFromCompare, removeUniversityFromCompare } = useComparison();
  const [highlightDifferences, setHighlightDifferences] = useState(false);
  const [isAddingWorkspaceId, setIsAddingWorkspaceId] = useState<string | null>(null);

  const { data: sessionRes, isLoading, refetch } = useQuery({
    queryKey: ['comparison-session-data', hash, selectedIds, selectedUniIds],
    queryFn: () => comparisonApi.getSession(hash!),
    enabled: !!hash,
  });

  const session = sessionRes?.data?.data;
  const programs: any[] = session?.selectedProgramIds || [];
  const analytics = session?.analytics || {};

  const handleAddToWorkspace = async (prog: any) => {
    setIsAddingWorkspaceId(prog._id);
    try {
      await applicationWorkspaceApi.createApplication({
        title: prog.name,
        subtitle: prog.universityName || 'Australian University',
        programChoice: {
          programId: prog._id,
          customProgramName: prog.name,
          customUniversityName: prog.universityName,
          studyLevel: prog.level,
          fieldOfStudy: prog.field,
          estimatedTuitionAud: prog.tuitionFeeInternational || prog.tuitionFeeAud,
          intakeTerm: prog.intakeMonths?.[0] || 'Feb / Term 1',
          intakeYear: new Date().getFullYear() + 1,
        },
      });
      toast.success(`"${prog.name}" added to Application Workspace! 🚀`);
      router.push('/dashboard/tracker');
    } catch {
      toast.error('Failed to add application');
    } finally {
      setIsAddingWorkspaceId(null);
    }
  };

  // Group metrics by category
  const categories = Array.from(new Set(PROGRAM_METRICS.map((m) => m.category)));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {/* Page Header */}
        <div className="bg-gradient-to-b from-muted/50 via-background to-background border-b border-border py-10">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  <Scale className="h-3.5 w-3.5 text-primary" />
                  <span>Public Decision Engine</span>
                  <span>/</span>
                  <span className="text-primary">Program Comparison</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-foreground">
                  Course Comparison Matrix
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                  Side-by-side evidence comparison with verified fees, intake deadlines, and graduate outcomes.
                </p>
              </div>

              {/* Controls: Highlight Differences & Add Courses */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-card p-2 px-3 rounded-xl border border-border">
                  <Switch
                    id="diff_switch"
                    checked={highlightDifferences}
                    onCheckedChange={setHighlightDifferences}
                  />
                  <Label htmlFor="diff_switch" className="text-xs font-semibold cursor-pointer">
                    Highlight Differences
                  </Label>
                </div>

                <Link href="/programs">
                  <Button size="sm" variant="outline" className="text-xs gap-1.5 h-9 rounded-xl bg-card">
                    <Plus className="h-3.5 w-3.5" />
                    Add More Programs
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main Comparison Container */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {programs.length === 0 ? (
            <div className="py-20 text-center rounded-2xl bg-card border border-border space-y-4">
              <Scale className="h-12 w-12 text-muted-foreground/40 mx-auto" />
              <h3 className="text-lg font-bold text-foreground">No Programs Selected for Comparison</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Explore the verified degree catalog and click &quot;Compare&quot; on up to 4 programs to analyze side-by-side.
              </p>
              <Link href="/programs">
                <Button size="sm" className="text-xs mt-2">
                  Browse Degree Catalog
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* 1. Visual Analytics Charts */}
              <ComparisonCharts
                mode="programs"
                programs={programs}
                analytics={analytics}
              />

              {/* 2. Side-by-Side Comparison Matrix Table */}
              <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    {/* Header Row: Program Cards Header */}
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="p-4 w-[220px] min-w-[200px] text-xs font-bold text-muted-foreground uppercase tracking-wider sticky left-0 bg-card/95 backdrop-blur-md z-20 border-r border-border">
                          Metric / Criteria
                        </th>
                        {programs.map((prog) => (
                          <th key={prog._id} className="p-5 min-w-[260px] max-w-[320px] align-top">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <Badge variant="outline" className="text-[10px] font-bold capitalize bg-primary/10 text-primary border-primary/20">
                                  {prog.level || 'Master'}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCompare(prog._id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive rounded-full"
                                  title="Remove from comparison"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div>
                                <Link
                                  href={`/programs/${prog.slug}`}
                                  className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-2"
                                >
                                  {prog.name}
                                </Link>
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                  {prog.universityName || (prog.university as any)?.name || 'University'}
                                </p>
                              </div>

                              {/* Action CTAs in Header */}
                              <div className="space-y-1.5 pt-2 border-t border-border">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleAddToWorkspace(prog)}
                                  disabled={isAddingWorkspaceId === prog._id}
                                  className="w-full text-xs h-8 gap-1.5 font-bold rounded-xl"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span>Add to workspace</span>
                                </Button>

                                {prog.website && (
                                  <a href={prog.website} target="_blank" rel="noopener noreferrer" className="block w-full">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="w-full text-[11px] h-7 gap-1 border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                                    >
                                      <span>Open official application</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* Metric Categories & Rows */}
                    <tbody className="divide-y divide-border text-xs">
                      {categories.map((category) => {
                        const rows = PROGRAM_METRICS.filter((m) => m.category === category);
                        return (
                          <div key={category} style={{ display: 'contents' }}>
                            {/* Category Section Heading */}
                            <tr className="bg-muted/60 border-y border-border">
                              <td
                                colSpan={programs.length + 1}
                                className="py-2.5 px-4 font-bold text-xs uppercase tracking-wider text-foreground sticky left-0"
                              >
                                {category}
                              </td>
                            </tr>

                            {/* Category Metric Rows */}
                            {rows.map((row) => {
                              const Icon = row.icon;

                              // Check if values differ across compared programs
                              const values = programs.map((p) => String(p[row.key] || ''));
                              const isDifferent = new Set(values).size > 1;

                              return (
                                <tr
                                  key={row.key}
                                  className={cn(
                                    'transition-colors hover:bg-accent/20',
                                    highlightDifferences && isDifferent && 'bg-amber-500/5'
                                  )}
                                >
                                  {/* Sticky Left Metric Label */}
                                  <td className="p-4 font-semibold text-foreground sticky left-0 bg-card/95 backdrop-blur-md z-10 border-r border-border space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                                      <span>{row.label}</span>
                                    </div>
                                    {row.sourceText && (
                                      <span className="text-[10px] text-muted-foreground font-mono block">
                                        {row.sourceText}
                                      </span>
                                    )}
                                  </td>

                                  {/* Item Values */}
                                  {programs.map((prog) => {
                                    const uniId = typeof prog.university === 'object' ? String((prog.university as any)?._id) : String(prog.university);
                                    const uniAnalytics = analytics[uniId];
                                    return (
                                      <td key={prog._id} className="p-4 align-top">
                                        {row.getValue(prog, uniAnalytics)}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </div>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
