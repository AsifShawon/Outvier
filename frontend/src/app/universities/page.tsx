'use client';

import { useState, useRef } from 'react';
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
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearchParams } from 'next/navigation';

const SA_STATES = ['SA', 'QLD', 'VIC', 'NSW', 'WA', 'TAS', 'NT', 'ACT'];

export default function UniversitiesPage() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [state, setState] = useState(searchParams.get('state') ?? '');
  const [type, setType] = useState(searchParams.get('type') ?? '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1'));
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['universities', { search: debouncedSearch, state, type, page }],
    queryFn: () =>
      universitiesApi.getAll({
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(state && state !== 'all' && { state }),
        ...(type && type !== 'all' && { type }),
        page,
        limit: 12,
      }),
  });

  const universities: University[] = data?.data?.universities || [];
  const pagination = data?.data?.pagination;

  const handleFilter = (key: string, value: string) => {
    setPage(1);
    if (key === 'state') setState(value === 'all' ? '' : value);
    if (key === 'type') setType(value === 'all' ? '' : value);
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
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search universities..."
              className="flex-1"
            />
            <Select value={state || 'all'} onValueChange={(v) => handleFilter('state', v as string)}>
              <SelectTrigger className="w-full sm:w-40" id="filter-state">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {SA_STATES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={type || 'all'} onValueChange={(v) => handleFilter('type', v as string)}>
              <SelectTrigger className="w-full sm:w-40" id="filter-type">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private</SelectItem>
              </SelectContent>
            </Select>
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
