'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Building2,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Award,
  MapPin,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { universitiesApi } from '@/lib/api/universities.api';
import { cricosApi } from '@/lib/api/cricos.api';
import { University as UniversityType } from '@/types/university';
import { format } from 'date-fns';

const STATES = [
  { label: 'All States', value: 'all' },
  { label: 'NSW', value: 'NSW' },
  { label: 'VIC', value: 'VIC' },
  { label: 'QLD', value: 'QLD' },
  { label: 'WA', value: 'WA' },
  { label: 'SA', value: 'SA' },
  { label: 'TAS', value: 'TAS' },
  { label: 'ACT', value: 'ACT' },
  { label: 'NT', value: 'NT' },
];

const STATUSES = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
];

export function UniversityTable() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteName, setDeleteName] = React.useState('');
  const [syncingId, setSyncingId] = React.useState<string | null>(null);

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
    defaultSortBy: 'name',
    defaultSortOrder: 'asc',
  });

  const stateFilter = searchParams.get('state') || 'all';
  const statusFilter = searchParams.get('status') || 'all';

  // Query server with server-side pagination, search, filters & sort
  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-universities', { debouncedSearch, stateFilter, statusFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      universitiesApi.adminGetAll({
        q: debouncedSearch || undefined,
        state: stateFilter !== 'all' ? stateFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
  });

  const universities: UniversityType[] = response?.data?.data || [];
  const meta = response?.data?.meta;
  const total = meta?.total || 0;

  // Single Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => universitiesApi.delete(id),
    onSuccess: () => {
      toast.success('University deleted successfully');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete university'),
  });

  // Single Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => cricosApi.syncUniversity(id),
    onSuccess: () => {
      toast.success('CRICOS Sync job triggered');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      setSyncingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sync failed');
      setSyncingId(null);
    },
  });

  // Bulk Sync Mutation
  const bulkSyncMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => cricosApi.syncUniversity(id))),
    onSuccess: () => {
      toast.success('Bulk sync jobs successfully triggered');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
    },
    onError: () => toast.error('Bulk sync failed'),
  });

  // Bulk Delete Mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => universitiesApi.delete(id))),
    onSuccess: () => {
      toast.success('Selected universities deleted');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
    },
    onError: () => toast.error('Bulk deletion failed'),
  });

  const columns: ColumnDef<UniversityType>[] = React.useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() ? 'indeterminate' : false)
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
            className="translate-y-[2px]"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Provider Name & Code"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const uni = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden">
                {uni.logoUrl || (uni as any).logo ? (
                  <img src={uni.logoUrl || (uni as any).logo} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/universities/${uni._id}/edit`}
                  className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate block"
                >
                  {uni.name}
                </Link>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <span>CRICOS: {uni.cricosProviderCode || (uni as any).providerCode || 'N/A'}</span>
                  {uni.ranking && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-500/10 text-amber-300 border-amber-500/20 font-sans">
                      #{uni.ranking}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'state',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Location / State"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 text-xs text-foreground font-medium">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.state || 'Australia'}</span>
            {row.original.city && <span className="text-muted-foreground">({row.original.city})</span>}
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Provider Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] uppercase font-semibold bg-surface-elevated text-muted-foreground">
            {row.original.type || (row.original as any).providerType || 'University'}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'active';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                status === 'active'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              ● {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'programCount',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Programs"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1 font-mono text-xs">
            <BookOpen className="h-3 w-3 text-muted-foreground" />
            <span>{row.original.programCount || 0}</span>
          </div>
        ),
      },
      {
        id: 'completeness',
        header: 'Completeness',
        cell: ({ row }) => {
          const completeness = (row.original as any).dataCompletenessScore || 85;
          return (
            <div className="w-24 space-y-1">
              <div className="flex justify-between text-[10px] font-mono">
                <span>{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-1.5 bg-slate-800" />
            </div>
          );
        },
      },
      {
        accessorKey: 'lastSyncedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Last Sync"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const uni = row.original;
          const syncDate = (uni as any).lastSyncedAt || uni.updatedAt;
          return (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-teal-400 shrink-0" />
              <span>{syncDate ? format(new Date(syncDate), 'MMM d, yyyy') : 'Never'}</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const uni = row.original;
          const isSyncing = syncingId === uni._id;
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                asChild
                title="Edit University"
              >
                <Link href={`/admin/universities/${uni._id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary"
                onClick={() => {
                  setSyncingId(uni._id);
                  syncMutation.mutate(uni._id);
                }}
                disabled={isSyncing}
                title="Trigger CRICOS Sync"
              >
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400"
                onClick={() => {
                  setDeleteId(uni._id);
                  setDeleteName(uni.name);
                }}
                title="Delete University"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting, syncingId, syncMutation]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Universities',
      key: 'all',
      active: stateFilter === 'all' && statusFilter === 'all',
      onClick: () => {
        setFilter('state', 'all');
        setFilter('status', 'all');
      },
    },
    {
      label: 'Active Only',
      key: 'active',
      active: statusFilter === 'active',
      onClick: () => setFilter('status', 'active'),
    },
    {
      label: 'NSW Institutions',
      key: 'nsw',
      active: stateFilter === 'NSW',
      onClick: () => setFilter('state', 'NSW'),
    },
    {
      label: 'VIC Institutions',
      key: 'vic',
      active: stateFilter === 'VIC',
      onClick: () => setFilter('state', 'VIC'),
    },
  ];

  return (
    <>
      <AdminDataTable
        columns={columns}
        data={universities}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by provider name, code, or city..."
        presetViews={presetViews}
        filters={
          <>
            <DataTableFacetedFilter
              title="State"
              options={STATES}
              value={stateFilter}
              onSelect={(v) => setFilter('state', v || 'all')}
            />
            <DataTableFacetedFilter
              title="Status"
              options={STATUSES}
              value={statusFilter}
              onSelect={(v) => setFilter('status', v || 'all')}
            />
          </>
        }
        activeFilterCount={(stateFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        bulkActions={[
          {
            label: 'Bulk Sync CRICOS',
            icon: RefreshCw,
            variant: 'outline',
            onExecute: async (ids) => {
              await bulkSyncMutation.mutateAsync(ids);
            },
          },
          {
            label: 'Delete Selected',
            icon: Trash2,
            isDestructive: true,
            confirmTitle: 'Delete Selected Universities',
            confirmDescription:
              'Are you sure you want to permanently delete the selected universities? This action cannot be undone.',
            onExecute: async (ids) => {
              await bulkDeleteMutation.mutateAsync(ids);
            },
          },
        ]}
      />

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete University"
        description={`Are you sure you want to delete "${deleteName}"? This will remove all associated provider records.`}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
