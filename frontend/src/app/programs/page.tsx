'use client';

import { useState, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { SearchBar } from '@/components/ui-custom/SearchBar';
import { Pagination } from '@/components/ui-custom/Pagination';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MapPin, Layers, ArrowUpDown, Filter } from 'lucide-react';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

const LEVELS = [
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'graduate_certificate', label: 'Grad. Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
];

const CAMPUS_MODES = [
  { value: 'on-campus', label: 'On Campus' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
];

import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'next/navigation';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'A-Z', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name_desc', label: 'Z-A', sortBy: 'name', sortOrder: 'desc' },
  { value: 'updated_desc', label: 'Recently Updated', sortBy: 'updatedAt', sortOrder: 'desc' },
];

function ProgramsContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [level, setLevel] = useState(searchParams.get('level') ?? '');
  const [campusMode, setCampusMode] = useState(searchParams.get('campusMode') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'name_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));
  const debouncedSearch = useDebounce(search, 350);

  const { data: citiesRes } = useQuery({
    queryKey: ['program-cities'],
    queryFn: () => programsApi.getCities().then(r => r.data),
  });
  const cities = citiesRes?.data || [];

  const selectedSort = SORT_OPTIONS.find(s => s.value === sort) || SORT_OPTIONS[0];

  const { data, isLoading } = useQuery({
    queryKey: ['programs', { search: debouncedSearch, level, campusMode, city, sort, page }],
    queryFn: () =>
      programsApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(level && level !== 'all' && { level }),
        ...(campusMode && campusMode !== 'all' && { campusMode }),
        ...(city && city !== 'all' && { city }),
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder,
        page,
        limit: 12,
      }),
  });

  const programs: Program[] = data?.data?.programs || [];
  const pagination = data?.data?.pagination;

  const handleFilter = (key: string, value: string) => {
    setPage(1);
    if (key === 'level') setLevel(value === 'all' ? '' : value);
    if (key === 'campusMode') setCampusMode(value === 'all' ? '' : value);
    if (key === 'city') setCity(value === 'all' ? '' : value);
    if (key === 'sort') setSort(value);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Page Header */}
        <div className="bg-gradient-to-b from-muted/50 to-background border-b border-border/60 py-12">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Badge variant="secondary" className="mb-3">Programs</Badge>
            <h1 className="text-3xl font-bold font-display mb-2">Browse Programs</h1>
            <p className="text-muted-foreground">
              {pagination ? `${pagination.total} programs` : 'Explore'} across Australian universities
            </p>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-3 mb-8">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search programs..."
              className="flex-1"
            />
            <div className="flex flex-wrap gap-3">
              <Select value={level || 'all'} onValueChange={(v) => handleFilter('level', v as string)}>
                <SelectTrigger className="w-[140px]" id="filter-level">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={city || 'all'} onValueChange={(v) => handleFilter('city', v as string)}>
                <SelectTrigger className="w-[140px]" id="filter-city">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={campusMode || 'all'} onValueChange={(v) => handleFilter('campusMode', v as string)}>
                <SelectTrigger className="w-[130px]" id="filter-campus">
                  <Layers className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {CAMPUS_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
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
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : programs.length === 0 ? (
            <EmptyState
              title="No programs found"
              description="Try adjusting your search or removing filters to see more results."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {programs.map((p) => <ProgramCard key={p._id} program={p} />)}
            </div>
          )}

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

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ProgramsContent />
    </Suspense>
  );
}
