'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cricosApi } from '@/lib/api/cricos.api';
import { format } from 'date-fns';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  Play,
  Database,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { toast } from 'sonner';

const STATUSES = [
  { label: 'All Runs', value: 'all' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Running', value: 'running' },
];

export default function SyncRunsPage() {
  const qc = useQueryClient();

  const {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    debouncedSearch,
    searchParams,
    setPage,
    setLimit,
    setSorting,
    setSearch,
    setFilter,
    resetFilters,
  } = useDataTableState({
    defaultSortBy: 'startedAt',
    defaultSortOrder: 'desc',
  });

  const statusFilter = searchParams.get('status') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cricos-sync-runs', { debouncedSearch, statusFilter, page, limit }],
    queryFn: () => cricosApi.getSyncRuns().then((r) => r.data),
  });

  const rawRuns: any[] = response?.data || [];
  const filteredRuns = rawRuns.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return (
        (r.providerCode || '').toLowerCase().includes(q) ||
        (r.syncType || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedRuns = filteredRuns.slice((page - 1) * limit, page * limit);
  const total = filteredRuns.length;

  const triggerFullSyncMutation = useMutation({
    mutationFn: () => cricosApi.syncAllInstitutions(),
    onSuccess: () => {
      toast.success('CRICOS Full Sync queued');
      qc.invalidateQueries({ queryKey: ['cricos-sync-runs'] });
    },
    onError: () => toast.error('Failed to trigger sync'),
  });

  const columns: ColumnDef<any>[] = React.useMemo(
    () => [
      {
        accessorKey: 'providerCode',
        header: 'Provider / Scope',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
              <Database className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-foreground uppercase">
                {row.original.providerCode || 'All Providers'}
              </p>
              <p className="text-[11px] text-muted-foreground capitalize">{row.original.syncType || 'Registry Sync'}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Execution Status',
        cell: ({ row }) => {
          const status = row.original.status || 'completed';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                status === 'completed'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : status === 'failed'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
              }`}
            >
              ● {status}
            </Badge>
          );
        },
      },
      {
        id: 'stats',
        header: 'Extraction Statistics',
        cell: ({ row }) => {
          const stats = row.original.stats || {};
          return (
            <div className="text-[11px] text-muted-foreground font-mono space-y-0.5">
              <div>Institutions: <span className="font-bold text-foreground">{stats.institutionsFetched ?? 0}</span></div>
              <div>Courses: <span className="font-bold text-foreground">{stats.coursesFetched ?? 0}</span></div>
              <div>Staged: <span className="font-bold text-purple-400">{stats.stagedChangesCreated ?? 0}</span></div>
            </div>
          );
        },
      },
      {
        accessorKey: 'startedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Started At"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground font-mono">
            {row.original.startedAt ? format(new Date(row.original.startedAt), 'MMM d, HH:mm') : '-'}
          </span>
        ),
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
          const start = row.original.startedAt ? new Date(row.original.startedAt).getTime() : 0;
          const end = row.original.finishedAt ? new Date(row.original.finishedAt).getTime() : 0;
          const durationSec = end && start ? Math.round((end - start) / 1000) : null;
          return (
            <span className="text-xs text-muted-foreground font-mono">
              {durationSec !== null ? `${durationSec}s` : 'Running...'}
            </span>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Runs',
      key: 'all',
      active: statusFilter === 'all',
      onClick: () => setFilter('status', 'all'),
    },
    {
      label: 'Completed',
      key: 'completed',
      active: statusFilter === 'completed',
      onClick: () => setFilter('status', 'completed'),
    },
    {
      label: 'Failed Runs',
      key: 'failed',
      active: statusFilter === 'failed',
      onClick: () => setFilter('status', 'failed'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">CRICOS Sync Jobs & History</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Monitor automated background runs against the Australian Government CRICOS Registry.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={paginatedRuns}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Filter sync runs by provider code or type..."
        presetViews={presetViews}
        filters={
          <DataTableFacetedFilter
            title="Status"
            options={STATUSES}
            value={statusFilter}
            onSelect={(v) => setFilter('status', v || 'all')}
          />
        }
        activeFilterCount={statusFilter !== 'all' ? 1 : 0}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        toolbarActions={
          <Button
            size="sm"
            onClick={() => triggerFullSyncMutation.mutate()}
            disabled={triggerFullSyncMutation.isPending}
            className="h-8 text-xs rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground"
          >
            {triggerFullSyncMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            <span>Trigger Full Sync</span>
          </Button>
        }
      />
    </div>
  );
}
