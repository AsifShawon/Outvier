'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { UniversityCard } from '@/components/ui-custom/UniversityCard';
import { ProminentSearchBar } from '@/components/discovery/ProminentSearchBar';
import { ActiveFilterChips } from '@/components/discovery/ActiveFilterChips';
import { ComparisonTray } from '@/components/compare/ComparisonTray';
import { Pagination } from '@/components/ui-custom/Pagination';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Award, ArrowUpDown, RotateCcw } from 'lucide-react';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';
import { useDebounce } from '@/hooks/useDebounce';

const SA_STATES = ['all', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

const RANKING_BANDS = [
  { value: 'all', label: 'All Rankings' },
  { value: 'top50', label: 'Top 50 Worldwide' },
  { value: 'top100', label: 'Top 100 Worldwide' },
  { value: 'top200', label: 'Top 200 Worldwide' },
  { value: 'top500', label: 'Top 500 Worldwide' },
  { value: 'unranked', label: 'Unranked' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)', sortBy: 'name', sortOrder: 'asc' },
  { value: 'ranking_asc', label: 'Global Ranking', sortBy: 'ranking', sortOrder: 'asc' },
  { value: 'programCount_desc', label: 'Most Programs', sortBy: 'programCount', sortOrder: 'desc' },
  { value: 'cost_asc', label: 'Tuition (Low to High)', sortBy: 'averageEstimatedTotalCostAud', sortOrder: 'asc' },
];

function UniversitiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [rankingBand, setRankingBand] = useState(searchParams.get('rankingBand') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'name_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const debouncedSearch = useDebounce(search, 300);

  // Sync state with URL searchParams
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (state) params.set('state', state);
    if (rankingBand) params.set('rankingBand', rankingBand);
    if (sort && sort !== 'name_asc') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const queryString = params.toString();
    router.replace(queryString ? `/universities?${queryString}` : '/universities', { scroll: false });
  }, [debouncedSearch, state, rankingBand, sort, page, router]);

  const selectedSort = SORT_OPTIONS.find((s) => s.value === sort) || SORT_OPTIONS[0];

  const { data, isLoading } = useQuery({
    queryKey: ['universities', { search: debouncedSearch, state, rankingBand, sort, page }],
    queryFn: () =>
      universitiesApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(state && state !== 'all' && { state }),
        ...(rankingBand && rankingBand !== 'all' && { rankingBand }),
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder as any,
        page,
        limit: 12,
      }),
  });

  const universities: University[] = (data?.data as any)?.universities || [];
  const pagination = (data?.data as any)?.pagination;

  const handleClearAll = () => {
    setSearch('');
    setState('');
    setRankingBand('');
    setPage(1);
  };

  const activeFilters = {
    state,
    rankingBand,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {/* Page Hero Header */}
        <div className="bg-gradient-to-b from-muted/50 via-background to-background border-b border-border py-10 sm:py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="space-y-1.5 max-w-2xl">
              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 mb-1">
                Australian Higher Education Providers
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
                Explore Australian Universities
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Compare official TEQSA-registered universities, global QS/THE rankings, graduate employment rates, and campus locations.
              </p>
            </div>

            {/* Prominent Search */}
            <div className="max-w-3xl pt-2">
              <ProminentSearchBar
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
                placeholder="Search universities by name, state, or abbreviation (e.g. UNSW, Melbourne, UQ, Sydney)..."
                suggestions={['UNSW Sydney', 'University of Melbourne', 'University of Sydney', 'Monash University', 'UQ Brisbane']}
              />
            </div>
          </div>
        </div>

        {/* Discovery Workspace Controls */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Filters & Sorting Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* State Filter */}
              <Select value={state || 'all'} onValueChange={(v) => { setState(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[130px] h-9 text-xs bg-background">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  {SA_STATES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s === 'all' ? 'All States' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Ranking Band Filter */}
              <Select value={rankingBand || 'all'} onValueChange={(v) => { setRankingBand(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px] h-9 text-xs bg-background">
                  <Award className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="All Rankings" />
                </SelectTrigger>
                <SelectContent>
                  {RANKING_BANDS.map((rb) => (
                    <SelectItem key={rb.value} value={rb.value} className="text-xs">
                      {rb.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <span className="text-xs font-bold text-foreground">
                {isLoading ? 'Searching...' : `${pagination?.total || 0} Universities Found`}
              </span>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">
                Sort:
              </span>
              <Select value={sort} onValueChange={(val) => setSort(val)}>
                <SelectTrigger className="w-[180px] h-9 text-xs bg-background">
                  <ArrowUpDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Chips */}
          <ActiveFilterChips
            filters={activeFilters}
            onRemove={(key) => {
              if (key === 'state') setState('');
              if (key === 'rankingBand') setRankingBand('');
              setPage(1);
            }}
            onClearAll={handleClearAll}
          />

          {/* Universities Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : universities.length === 0 ? (
            <div className="py-16 text-center">
              <EmptyState
                icon={<Building2 className="h-7 w-7 text-muted-foreground" />}
                title="No universities matched your search"
                description="Try adjusting your keywords or clearing the state filter."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {universities.map((university) => (
                <UniversityCard key={university._id} university={university} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="pt-8 flex justify-center">
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

      {/* Floating Comparison Tray */}
      <ComparisonTray />

      <Footer />
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold">Loading universities...</div>}>
      <UniversitiesContent />
    </Suspense>
  );
}
