'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

export interface UseDataTableStateOptions {
  defaultPage?: number;
  defaultLimit?: number;
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
  debounceMs?: number;
}

export function useDataTableState(options: UseDataTableStateOptions = {}) {
  const {
    defaultPage = 1,
    defaultLimit = 20,
    defaultSortBy = 'createdAt',
    defaultSortOrder = 'desc',
    debounceMs = 350,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL state
  const rawPage = searchParams.get('page');
  const page = rawPage ? Math.max(1, parseInt(rawPage, 10)) : defaultPage;

  const rawLimit = searchParams.get('limit');
  const limit = rawLimit ? Math.max(1, parseInt(rawLimit, 10)) : defaultLimit;

  const sortBy = searchParams.get('sortBy') || defaultSortBy;
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || defaultSortOrder;
  const urlSearch = searchParams.get('q') || '';

  // Local state for immediate typing feedback
  const [localSearch, setLocalSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(localSearch, debounceMs);

  const updateUrl = useCallback(
    (newParams: Record<string, string | number | undefined | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '' || val === 'all') {
          params.delete(key);
        } else {
          params.set(key, String(val));
        }
      });

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (newPage: number) => {
      updateUrl({ page: newPage });
    },
    [updateUrl]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      updateUrl({ limit: newLimit, page: 1 });
    },
    [updateUrl]
  );

  const setSorting = useCallback(
    (newSortBy: string, newSortOrder?: 'asc' | 'desc') => {
      if (sortBy === newSortBy && !newSortOrder) {
        // Toggle order
        const toggledOrder = sortOrder === 'asc' ? 'desc' : 'asc';
        updateUrl({ sortBy: newSortBy, sortOrder: toggledOrder, page: 1 });
      } else {
        updateUrl({
          sortBy: newSortBy,
          sortOrder: newSortOrder || 'asc',
          page: 1,
        });
      }
    },
    [sortBy, sortOrder, updateUrl]
  );

  const setSearch = useCallback(
    (text: string) => {
      setLocalSearch(text);
      updateUrl({ q: text || null, page: 1 });
    },
    [updateUrl]
  );

  const setFilter = useCallback(
    (key: string, value: string | number | null | undefined) => {
      updateUrl({ [key]: value, page: 1 });
    },
    [updateUrl]
  );

  const setFilters = useCallback(
    (filters: Record<string, string | number | null | undefined>) => {
      updateUrl({ ...filters, page: 1 });
    },
    [updateUrl]
  );

  const resetFilters = useCallback(
    (preservedKeys: string[] = []) => {
      const params = new URLSearchParams();
      preservedKeys.forEach((key) => {
        const val = searchParams.get(key);
        if (val) params.set(key, val);
      });
      setLocalSearch('');
      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return {
    page,
    limit,
    sortBy,
    sortOrder,
    search: localSearch,
    debouncedSearch,
    isPending,
    searchParams,
    setPage,
    setLimit,
    setSorting,
    setSearch,
    setFilter,
    setFilters,
    resetFilters,
  };
}
