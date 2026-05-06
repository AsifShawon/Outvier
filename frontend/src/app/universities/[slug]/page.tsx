'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Globe, Calendar, Award, Users, ChevronRight, BookOpen } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { universitiesApi } from '@/lib/api/universities.api';
import { programsApi } from '@/lib/api/programs.api';
import { University } from '@/types/university';
import { Program } from '@/types/program';

export default function UniversityDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: uniData, isLoading: uniLoading, isError } = useQuery({
    queryKey: ['university', slug],
    queryFn: () => universitiesApi.getBySlug(slug),
  });

  const { data: programsData, isLoading: programsLoading } = useQuery({
    queryKey: ['university-programs', slug],
    queryFn: () => programsApi.getAll({ universitySlug: slug, limit: 20 }),
    enabled: !!slug,
  });

  const university: University | undefined = uniData?.data?.data;
  const programs: Program[] = programsData?.data?.programs || [];

  if (isError) return notFound();

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
              <Link href="/universities" className="hover:text-foreground">Universities</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground">{university?.name || '...'}</span>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="gradient-hero text-white py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {uniLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-80 bg-white/10" />
                <Skeleton className="h-5 w-56 bg-white/10" />
              </div>
            ) : university ? (
              <div>
                <div className="flex items-start gap-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white font-bold text-2xl font-display border border-white/20">
                    {university.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-3xl font-bold font-display">{university.name}</h1>
                      <Badge className="bg-white/10 text-white border-white/20">{university.type}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-white/70 text-sm">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {university.city || university.location}, {university.state}
                      </span>
                      {university.cricosProviderCode && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                          CRICOS: {university.cricosProviderCode}
                        </span>
                      )}
                      {university.establishedYear && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Est. {university.establishedYear}
                        </span>
                      )}
                      {university.ranking && (
                        <span className="flex items-center gap-1">
                          <Award className="h-3.5 w-3.5" />
                          Ranked #{university.ranking}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              {university && (
                <div>
                  <h2 className="text-xl font-bold font-display mb-4">About</h2>
                  <p className="text-muted-foreground leading-relaxed">{university.description}</p>
                </div>
              )}

              {/* Programs */}
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl font-bold font-display">Programs Offered</h2>
                  <Badge variant="secondary">{programs.length} programs</Badge>
                </div>
                {programsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {programs.map((p) => <ProgramCard key={p._id} program={p} />)}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {university && (
              <aside className="space-y-5">
                {/* Quick info */}
                <div className="rounded-xl border border-border/60 bg-card p-5">
                  <h3 className="font-semibold mb-4">Quick Info</h3>
                  <dl className="space-y-3">
                    {[
                      { label: 'State', value: university.state },
                      { label: 'Type', value: university.type === 'public' ? 'Public University' : 'Private University' },
                      { label: 'CRICOS Code', value: university.cricosProviderCode || 'N/A' },
                      { label: 'International Students', value: university.internationalStudents ? 'Yes' : 'Limited' },
                    ].map((item) => (
                      <div key={item.label} className="flex justify-between items-start gap-2">
                        <dt className="text-xs text-muted-foreground shrink-0">{item.label}</dt>
                        <dd className="text-xs font-medium text-right">{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Website */}
                <a
                  href={university.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-border/60 bg-card p-4 text-sm font-medium hover:bg-muted/50 hover:border-primary/30 transition-colors"
                >
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Visit Official Website
                </a>

                {/* Browse all programs CTA */}
                <Link href={`/programs?universitySlug=${university.slug}`}>
                  <Button variant="outline" className="w-full gap-2">
                    <BookOpen className="h-4 w-4" />
                    Browse All Programs
                  </Button>
                </Link>

                {university.sourceMetadata?.sourceName === 'CRICOS' && (
                  <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-[10px] text-muted-foreground text-center">
                    Data source: Official CRICOS / data.gov.au
                    {university.sourceMetadata.fetchedAt && ` • Last synced: ${new Date(university.sourceMetadata.fetchedAt).toLocaleDateString()}`}
                  </div>
                )}
              </aside>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
