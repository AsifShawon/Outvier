'use client';

import { useState, useRef, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { UniversityCard } from '@/components/ui-custom/UniversityCard';
import { SearchBar } from '@/components/ui-custom/SearchBar';
import { Pagination } from '@/components/ui-custom/Pagination';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award, ArrowUpDown, Filter } from 'lucide-react';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'next/navigation';

const SA_STATES = ['SA', 'QLD', 'VIC', 'NSW', 'WA', 'TAS', 'NT', 'ACT'];

const RANKING_BANDS = [
  { value: 'top50', label: 'Top 50' },
  { value: 'top100', label: 'Top 100' },
  { value: 'top200', label: 'Top 200' },
  { value: 'top500', label: 'Top 500' },
  { value: 'unranked', label: 'Unranked' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'A-Z', sortBy: 'name', sortOrder: 'asc' },
  { value: 'ranking_asc', label: 'Best Ranking', sortBy: 'ranking', sortOrder: 'asc' },
  { value: 'programCount_desc', label: 'Most Programs', sortBy: 'programCount', sortOrder: 'desc' },
  { value: 'cost_asc', label: 'Lower Cost', sortBy: 'averageEstimatedTotalCostAud', sortOrder: 'asc' },
];

function UniversitiesContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [state, setState] = useState(searchParams.get('state') ?? '');
  const [rankingBand, setRankingBand] = useState(searchParams.get('rankingBand') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'name_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));
  const debouncedSearch = useDebounce(search, 350);

  const selectedSort = SORT_OPTIONS.find(s => s.value === sort) || SORT_OPTIONS[0];

  const { data, isLoading } = useQuery({
    queryKey: ['universities', { search: debouncedSearch, state, rankingBand, sort, page }],
    queryFn: () =>
      universitiesApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(state && state !== 'all' && { state }),
        ...(rankingBand && rankingBand !== 'all' && { rankingBand }),
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder,
        page,
        limit: 12,
      }),
  });

  const universities: University[] = data?.data?.universities || [];
  const pagination = data?.data?.pagination;

  const handleFilter = (key: string, value: string) => {
    setPage(1);
    if (key === 'state') setState(value === 'all' ? '' : value);
    if (key === 'rankingBand') setRankingBand(value === 'all' ? '' : value);
    if (key === 'sort') setSort(value);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border/60 py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-3">Universities</Badge>
            <h1 className="text-3xl font-bold font-display mb-2">Explore Universities</h1>
            <p className="text-muted-foreground">
              {pagination ? `${pagination.total} universities` : 'Discover'} across Australia
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-8">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search universities..."
              className="flex-1"
            />
            <div className="flex flex-wrap gap-3">
              <Select value={state || 'all'} onValueChange={(v) => handleFilter('state', v as string)}>
                <SelectTrigger className="w-[140px]" id="filter-state">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {SA_STATES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={rankingBand || 'all'} onValueChange={(v) => handleFilter('rankingBand', v as string)}>
                <SelectTrigger className="w-[150px]" id="filter-ranking">
                  <Award className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="All Rankings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rankings</SelectItem>
                  {RANKING_BANDS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => handleFilter('sort', v as string)}>
                <SelectTrigger className="w-[160px]" id="filter-sort">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : universities.length === 0 ? (
            <EmptyState
              title="No universities found"
              description="Try adjusting your search or removing filters."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {universities.map((uni) => (
                <UniversityCard key={uni._id} university={uni} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.pages}
              onPageChange={setPage}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <UniversitiesContent />
    </Suspense>
  );
}
