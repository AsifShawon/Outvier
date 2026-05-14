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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, MapPin, Layers, ArrowUpDown, Filter, GraduationCap, DollarSign, Calendar } from 'lucide-react';
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

const BUDGET_OPTIONS = [
  { label: "Under $10k", value: "under-10k" },
  { label: "$10k - $20k", value: "10k-20k" },
  { label: "$20k - $30k", value: "20k-30k" },
  { label: "$30k - $40k", value: "30k-40k" },
  { label: "$40k - $50k", value: "40k-50k" },
  { label: "Over $50k", value: "over-50k" }
];

const INTAKE_OPTIONS = ["February", "July", "November"];

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
  const [field, setField] = useState(searchParams.get('field') ?? '');
  const [campusMode, setCampusMode] = useState(searchParams.get('campusMode') ?? '');
  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [budget, setBudget] = useState(searchParams.get('budget') ?? '');
  const [intake, setIntake] = useState(searchParams.get('intake') ?? '');
  const [sort, setSort] = useState(searchParams.get('sort') ?? 'name_asc');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));
  const debouncedSearch = useDebounce(search, 350);

  const { data: citiesRes } = useQuery({
    queryKey: ['program-cities'],
    queryFn: () => programsApi.getCities().then(r => r.data),
  });
  const citiesRaw = citiesRes?.data;
  const cities = Array.isArray(citiesRaw) ? citiesRaw : [];

  const { data: fieldsRes } = useQuery({
    queryKey: ['program-fields'],
    queryFn: () => programsApi.getFields().then(r => r.data),
  });
  const fieldsRaw = fieldsRes?.data;
  const fields = Array.isArray(fieldsRaw) ? fieldsRaw : [];

  const selectedSort = SORT_OPTIONS.find(s => s.value === sort) || SORT_OPTIONS[0];

  const { data, isLoading } = useQuery({
    queryKey: ['programs', { search: debouncedSearch, level, field, campusMode, city, budget, intake, sort, page }],
    queryFn: () =>
      programsApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(level && level !== 'all' && { level }),
        ...(field && field !== 'all' && { field }),
        ...(campusMode && campusMode !== 'all' && { campusMode }),
        ...(city && city !== 'all' && { city }),
        ...(budget && budget !== 'all' && { budget }),
        ...(intake && intake !== 'all' && { intake }),
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
    if (key === 'field') setField(value === 'all' ? '' : value);
    if (key === 'campusMode') setCampusMode(value === 'all' ? '' : value);
    if (key === 'city') setCity(value === 'all' ? '' : value);
    if (key === 'budget') setBudget(value === 'all' ? '' : value);
    if (key === 'intake') setIntake(value === 'all' ? '' : value);
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
          <div className="mb-8 space-y-4">
            <div className="flex gap-3">
              <SearchBar
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search programs..."
                className="flex-1"
              />
              <div className="lg:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="px-3 h-10">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="flex flex-col gap-4 mt-6">
                      <Select value={level || 'all'} onValueChange={(v) => handleFilter('level', v as string)}>
                        <SelectTrigger className="w-full" id="filter-level-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Level:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {LEVELS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={field || 'all'} onValueChange={(v) => handleFilter('field', v as string)}>
                        <SelectTrigger className="w-full" id="filter-field-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Subject:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {fields.map((f: string) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={campusMode || 'all'} onValueChange={(v) => handleFilter('campusMode', v as string)}>
                        <SelectTrigger className="w-full" id="filter-campus-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Mode:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {CAMPUS_MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={city || 'all'} onValueChange={(v) => handleFilter('city', v as string)}>
                        <SelectTrigger className="w-full" id="filter-city-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">City:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {cities.map((c: string) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={budget || 'all'} onValueChange={(v) => handleFilter('budget', v as string)}>
                        <SelectTrigger className="w-full" id="filter-budget-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Budget:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {BUDGET_OPTIONS.map((b) => (
                            <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={intake || 'all'} onValueChange={(v) => handleFilter('intake', v as string)}>
                        <SelectTrigger className="w-full" id="filter-intake-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Intake:</span>
                            <SelectValue placeholder="All" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {INTAKE_OPTIONS.map((i) => (
                            <SelectItem key={i} value={i}>{i}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select value={sort} onValueChange={(v) => handleFilter('sort', v as string)}>
                        <SelectTrigger className="w-full" id="filter-sort-mobile">
                          <div className="flex items-center gap-1.5 truncate">
                            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground font-medium">Sort:</span>
                            <SelectValue placeholder="A-Z" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            {/* Desktop Filters (Rows 2 & 3) */}
            <div className="hidden lg:grid grid-cols-4 gap-3">
              <Select value={level || 'all'} onValueChange={(v) => handleFilter('level', v as string)}>
                <SelectTrigger className="w-full" id="filter-level">
                  <div className="flex items-center gap-1.5 truncate">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Level:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {LEVELS.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={field || 'all'} onValueChange={(v) => handleFilter('field', v as string)}>
                <SelectTrigger className="w-full" id="filter-field">
                  <div className="flex items-center gap-1.5 truncate">
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Subject:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {fields.map((f: string) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={campusMode || 'all'} onValueChange={(v) => handleFilter('campusMode', v as string)}>
                <SelectTrigger className="w-full" id="filter-campus">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Mode:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {CAMPUS_MODES.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={city || 'all'} onValueChange={(v) => handleFilter('city', v as string)}>
                <SelectTrigger className="w-full" id="filter-city">
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">City:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {cities.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={budget || 'all'} onValueChange={(v) => handleFilter('budget', v as string)}>
                <SelectTrigger className="w-full" id="filter-budget">
                  <div className="flex items-center gap-1.5 truncate">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Budget:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {BUDGET_OPTIONS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={intake || 'all'} onValueChange={(v) => handleFilter('intake', v as string)}>
                <SelectTrigger className="w-full" id="filter-intake">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Intake:</span>
                    <SelectValue placeholder="All" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {INTAKE_OPTIONS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sort} onValueChange={(v) => handleFilter('sort', v as string)}>
                <SelectTrigger className="w-full" id="filter-sort">
                  <div className="flex items-center gap-1.5 truncate">
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground font-medium">Sort:</span>
                    <SelectValue placeholder="A-Z" />
                  </div>
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
