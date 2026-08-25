'use client';

import { useState, useEffect, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProgramCard } from '@/components/ui-custom/ProgramCard';
import { ProminentSearchBar } from '@/components/discovery/ProminentSearchBar';
import { ActiveFilterChips } from '@/components/discovery/ActiveFilterChips';
import { FilterDrawer } from '@/components/discovery/FilterDrawer';
import { ComparisonTray } from '@/components/compare/ComparisonTray';
import { Pagination } from '@/components/ui-custom/Pagination';
import { SkeletonCard } from '@/components/ui-custom/SkeletonCard';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  ArrowUpDown,
  SlidersHorizontal,
  Bookmark,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';
import { useDebounce } from '@/hooks/useDebounce';
import { useSavedSearches } from '@/hooks/useSavedSearches';

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Program Name (A-Z)', sortBy: 'name', sortOrder: 'asc' },
  { value: 'name_desc', label: 'Program Name (Z-A)', sortBy: 'name', sortOrder: 'desc' },
  { value: 'fee_asc', label: 'Tuition (Low to High)', sortBy: 'primaryFeeAnnualAud', sortOrder: 'asc' },
  { value: 'fee_desc', label: 'Tuition (High to Low)', sortBy: 'primaryFeeAnnualAud', sortOrder: 'desc' },
  { value: 'updated_desc', label: 'Recently Verified', sortBy: 'updatedAt', sortOrder: 'desc' },
];

function ProgramsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial filter values from URL params
  const [search, setSearch] = useState(searchParams.get('search') || searchParams.get('q') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [field, setField] = useState(searchParams.get('field') || '');
  const [campusMode, setCampusMode] = useState(searchParams.get('campusMode') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [state, setState] = useState(searchParams.get('state') || '');
  const [budget, setBudget] = useState(searchParams.get('budget') || '');
  const [feeYear, setFeeYear] = useState(searchParams.get('feeYear') || '');
  const [intake, setIntake] = useState(searchParams.get('intake') || '');
  const [englishMax, setEnglishMax] = useState(searchParams.get('englishMax') || '');
  const [cricos, setCricos] = useState(searchParams.get('cricos') || '');
  const [scholarshipAvailable, setScholarshipAvailable] = useState(searchParams.get('scholarshipAvailable') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'name_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Sync state changes back to URL searchParams
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (level) params.set('level', level);
    if (field) params.set('field', field);
    if (campusMode) params.set('campusMode', campusMode);
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    if (budget) params.set('budget', budget);
    if (feeYear) params.set('feeYear', feeYear);
    if (intake) params.set('intake', intake);
    if (englishMax) params.set('englishMax', englishMax);
    if (cricos) params.set('cricos', cricos);
    if (scholarshipAvailable) params.set('scholarshipAvailable', scholarshipAvailable);
    if (sort && sort !== 'name_asc') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));

    const queryString = params.toString();
    router.replace(queryString ? `/programs?${queryString}` : '/programs', { scroll: false });
  }, [
    debouncedSearch,
    level,
    field,
    campusMode,
    city,
    state,
    budget,
    feeYear,
    intake,
    englishMax,
    cricos,
    scholarshipAvailable,
    sort,
    page,
    router,
  ]);

  // Cities & Fields queries for dropdowns
  const { data: citiesRes } = useQuery({
    queryKey: ['program-cities'],
    queryFn: () => programsApi.getCities().then((r) => r.data),
  });
  const cities = Array.isArray(citiesRes?.data) ? citiesRes.data : [];

  const { data: fieldsRes } = useQuery({
    queryKey: ['program-fields'],
    queryFn: () => programsApi.getFields().then((r) => r.data),
  });
  const fields = Array.isArray(fieldsRes?.data) ? fieldsRes.data : [];

  const selectedSort = SORT_OPTIONS.find((s) => s.value === sort) || SORT_OPTIONS[0];

  // Main Query
  const { data, isLoading } = useQuery({
    queryKey: [
      'programs',
      {
        search: debouncedSearch,
        level,
        field,
        campusMode,
        city,
        state,
        budget,
        feeYear,
        intake,
        englishMax,
        cricos,
        scholarshipAvailable,
        sort,
        page,
      },
    ],
    queryFn: () =>
      programsApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(level && level !== 'all' && { level }),
        ...(field && field !== 'all' && { field }),
        ...(campusMode && campusMode !== 'all' && { campusMode }),
        ...(city && city !== 'all' && { city }),
        ...(state && state !== 'all' && { state }),
        ...(budget && budget !== 'all' && { budget }),
        ...(feeYear && feeYear !== 'all' && { feeYear }),
        ...(intake && intake !== 'all' && { intake }),
        ...(englishMax && englishMax !== 'all' && { englishMax: parseFloat(englishMax) }),
        ...(cricos && { cricos: 'true' }),
        ...(scholarshipAvailable && { scholarshipAvailable: 'true' }),
        sortBy: selectedSort.sortBy,
        sortOrder: selectedSort.sortOrder as any,
        page,
        limit: 12,
      }),
  });

  const programs: Program[] = (data?.data as any)?.programs || [];
  const pagination = (data?.data as any)?.pagination;

  const handleFilterChange = (key: string, value: any) => {
    setPage(1);
    if (key === 'level') setLevel(value);
    if (key === 'field') setField(value);
    if (key === 'campusMode') setCampusMode(value);
    if (key === 'city') setCity(value);
    if (key === 'state') setState(value);
    if (key === 'budget') setBudget(value);
    if (key === 'feeYear') setFeeYear(value);
    if (key === 'intake') setIntake(value);
    if (key === 'englishMax') setEnglishMax(value);
    if (key === 'cricos') setCricos(value);
    if (key === 'scholarshipAvailable') setScholarshipAvailable(value);
  };

  const handleRemoveFilter = (key: string) => {
    handleFilterChange(key, '');
  };

  const handleClearAll = () => {
    setSearch('');
    setLevel('');
    setField('');
    setCampusMode('');
    setCity('');
    setState('');
    setBudget('');
    setFeeYear('');
    setIntake('');
    setEnglishMax('');
    setCricos('');
    setScholarshipAvailable('');
    setPage(1);
  };

  const activeFilters = {
    level,
    field,
    campusMode,
    city,
    state,
    budget,
    feeYear,
    intake,
    englishMax,
    cricos,
    scholarshipAvailable,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 pb-24">
        {/* Hero Section with Prominent Search */}
        <div className="bg-gradient-to-b from-muted/50 via-background to-background border-b border-border py-10 sm:py-14">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-5">
            <div className="space-y-1.5 max-w-2xl">
              <Badge variant="outline" className="text-[11px] font-bold uppercase tracking-wider text-primary border-primary/30 bg-primary/5 mb-1">
                Verified Higher Education Catalog
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-foreground">
                Discover Degree Programs in Australia
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                Search accredited Bachelor, Master, PhD, and pathway courses with transparent fee schedules, entry benchmarks, and verified CRICOS data.
              </p>
            </div>

            {/* Prominent Search Bar */}
            <div className="max-w-3xl pt-2">
              <ProminentSearchBar
                value={search}
                onChange={(val) => {
                  setSearch(val);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Discovery Workspace Controls */}
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {/* Controls Bar: Results Count + Filter Drawer Trigger + Sort */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border shadow-xs">
            <div className="flex items-center gap-3">
              <FilterDrawer
                filters={activeFilters}
                onChange={handleFilterChange}
                onClearAll={handleClearAll}
                cities={cities}
                fields={fields}
                isOpen={isFilterDrawerOpen}
                onOpenChange={setIsFilterDrawerOpen}
              />

              <span className="text-xs font-bold text-foreground">
                {isLoading ? 'Searching...' : `${pagination?.total || 0} Programs Found`}
              </span>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground whitespace-nowrap hidden sm:inline">
                Sort by:
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

          {/* Active Filter Chips */}
          <ActiveFilterChips
            filters={activeFilters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAll}
          />

          {/* Programs Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="py-16 text-center">
              <EmptyState
                icon={<GraduationCap className="h-7 w-7 text-muted-foreground" />}
                title="No degree programs matched your search"
                description="Try adjusting your keywords, broadening your tuition budget, or clearing filter criteria."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {programs.map((program) => (
                <ProgramCard key={program._id} program={program} />
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

export default function ProgramsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-semibold">Loading programs...</div>}>
      <ProgramsContent />
    </Suspense>
  );
}
