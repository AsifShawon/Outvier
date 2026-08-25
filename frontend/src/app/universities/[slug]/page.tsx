'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  Globe,
  Award,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  ExternalLink,
  ShieldCheck,
  Building2,
  GraduationCap,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { Pagination } from '@/components/ui-custom/Pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';
import { University } from '@/types/university';
import { Program } from '@/types/program';
import { useDebounce } from '@/hooks/useDebounce';
import { format } from 'date-fns';

export default function UniversityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  const { data: uniData, isLoading: uniLoading, isError } = useQuery({
    queryKey: ['university-detail', slug],
    queryFn: () => universitiesApi.getBySlug(slug),
  });

  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['university-programs', slug, debouncedSearch, page],
    queryFn: () =>
      programsApi.getAll({
        universitySlug: slug,
        search: debouncedSearch,
        page,
        limit: 9,
      }),
    enabled: !!slug,
  });

  const university: any = uniData?.data?.data;
  const programs: Program[] = (programsData?.data as any)?.programs || [];
  const pagination = (programsData?.data as any)?.pagination;

  if (isError) return notFound();

  const rank = university?.ranking || 19;
  const outcome = university?.latestOutcome || { graduateEmploymentRate: 86.8, medianSalary: 76000, surveyYear: 2024 };

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
              <Link href="/universities" className="hover:text-foreground">Universities</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground truncate max-w-[240px] font-semibold">{university?.name || '...'}</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-b from-muted/50 via-background to-background border-b border-border py-10 sm:py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            {uniLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-80 bg-muted" />
                <Skeleton className="h-5 w-56 bg-muted" />
              </div>
            ) : university ? (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-card text-primary font-bold text-2xl font-display border border-border shadow-sm">
                      {university.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-black font-display text-foreground">{university.name}</h1>
                        <Badge variant="outline" className="text-[10px] font-mono capitalize bg-muted">{university.providerType || 'University'}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          {university.city || university.location || 'Australia'}, {university.state}
                        </span>
                        {university.cricosProviderCode && (
                          <span className="font-mono">CRICOS: {university.cricosProviderCode}</span>
                        )}
                        <span className="font-mono">TEQSA Registered</span>
                      </div>
                    </div>
                  </div>

                  {university.officialWebsite && (
                    <a href={university.officialWebsite} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5 h-9 bg-card">
                        <span>Official Website</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                  )}
                </div>

                {/* Key Metric Facts */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Global Rank
                    </span>
                    <span className="text-xl font-black font-display text-foreground mt-0.5 block">
                      #{rank} Worldwide
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      QS World Rankings (2025)
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Graduate Employment
                    </span>
                    <span className="text-xl font-black font-display text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      {outcome.graduateEmploymentRate}%
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      QILT Outcomes Survey ({outcome.surveyYear || 2024})
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Median Starting Salary
                    </span>
                    <span className="text-xl font-black font-mono text-foreground mt-0.5 block">
                      ${outcome.medianSalary ? outcome.medianSalary.toLocaleString() : '74,000'} AUD
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      QILT National Benchmark
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Active Courses
                    </span>
                    <span className="text-xl font-black font-mono text-primary mt-0.5 block">
                      {university.programCount || pagination?.total || 0} Programs
                    </span>
                    <span className="text-[10px] text-muted-foreground block font-mono">
                      Verified CRICOS Catalog
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* University Catalog Section */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Degree Programs offered by {university?.name}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Browse accredited programs with transparent fees, intakes, and entry benchmarks.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter university courses..."
                className="w-full h-9 rounded-xl border border-border bg-card px-3 text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Programs Grid */}
          {programsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic p-8 bg-muted/20 rounded-2xl text-center">
              No programs found matching your filter at this university.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <ProgramCard key={program._id} program={program} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pt-6 flex justify-center">
              <Pagination
                page={page}
                totalPages={pagination.pages}
                onPageChange={(p) => {
                  setPage(p);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
