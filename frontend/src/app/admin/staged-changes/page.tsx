'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GitCompare,
  CheckCircle2,
  XCircle,
  Sparkles,
  ShieldCheck,
  Building2,
  BookOpen,
  Eye,
  Loader2,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { adminApi } from '@/lib/api/admin.api';
import { DiffViewer } from '@/components/admin/DiffViewer';
import { format } from 'date-fns';

const ENTITY_TYPES = [
  { label: 'All Entities', value: 'all' },
  { label: 'University', value: 'university' },
  { label: 'Program', value: 'program' },
  { label: 'Campus', value: 'campus' },
  { label: 'Ranking', value: 'ranking' },
  { label: 'Tuition', value: 'tuition' },
];

const STATUSES = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function StagedChangesPage() {
  const qc = useQueryClient();
  const [inspectChange, setInspectChange] = React.useState<any | null>(null);

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
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const entityTypeFilter = searchParams.get('entityType') || 'all';
  const statusFilter = searchParams.get('status') || 'pending';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['staged-changes', { debouncedSearch, entityTypeFilter, statusFilter, page, limit, sortBy, sortOrder }],
    queryFn: () => {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (entityTypeFilter !== 'all') params.entityType = entityTypeFilter;
      if (debouncedSearch) params.externalKey = debouncedSearch;
      return adminApi.listStagedChanges(params).then((r) => r.data);
    },
  });

  const changes: any[] = response?.data || [];
  const meta = response?.meta;
  const total = meta?.total || changes.length;

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveStagedChange(id),
    onSuccess: () => {
      toast.success('Change approved and published');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
      setInspectChange(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectStagedChange(id),
    onSuccess: () => {
      toast.success('Change rejected');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
      setInspectChange(null);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Rejection failed'),
  });

  const bulkApproveMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkApproveStagedChanges(ids),
    onSuccess: () => {
      toast.success('Selected changes approved and published');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: () => toast.error('Bulk approval failed'),
  });

  const bulkRejectMutation = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkRejectStagedChanges(ids),
    onSuccess: () => {
      toast.success('Selected changes rejected');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: () => toast.error('Bulk rejection failed'),
  });

  const columns: ColumnDef<any>[] = React.useMemo(
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
        accessorKey: 'entityName',
        header: 'Entity / Title',
        cell: ({ row }) => {
          const item = row.original;
          const entityType = item.entityType || 'university';
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                {entityType === 'program' ? (
                  <BookOpen className="h-4 w-4 text-purple-400" />
                ) : (
                  <Building2 className="h-4 w-4 text-teal-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">
                  {item.entityName || item.externalKey || 'Entity Change'}
                </p>
                <Badge variant="outline" className="text-[9px] uppercase font-semibold mt-0.5 bg-surface-elevated">
                  {entityType}
                </Badge>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'source',
        header: 'Source Origin',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px] block">
            {row.original.source || 'CRICOS Sync'}
          </span>
        ),
      },
      {
        accessorKey: 'confidence',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Confidence"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const conf = row.original.confidence || 0.85;
          const pct = Math.round(conf * 100);
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-mono font-bold ${
                pct >= 85
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : pct >= 70
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {pct}%
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Staged Date"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground">
            {row.original.createdAt ? format(new Date(row.original.createdAt), 'MMM d, yyyy') : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Review Status',
        cell: ({ row }) => {
          const status = row.original.status || 'pending';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                status === 'approved'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : status === 'rejected'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              ● {status}
            </Badge>
          );
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const item = row.original;
          const isPending = item.status === 'pending';
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setInspectChange(item)}
                title="Inspect Diff"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>

              {isPending && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-teal-400"
                    onClick={() => approveMutation.mutate(item._id)}
                    title="Approve Change"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400"
                    onClick={() => rejectMutation.mutate(item._id)}
                    title="Reject Change"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting, approveMutation, rejectMutation]
  );

  const presetViews: PresetView[] = [
    {
      label: 'Pending Review',
      key: 'pending',
      active: statusFilter === 'pending',
      onClick: () => setFilter('status', 'pending'),
    },
    {
      label: 'Approved',
      key: 'approved',
      active: statusFilter === 'approved',
      onClick: () => setFilter('status', 'approved'),
    },
    {
      label: 'Rejected',
      key: 'rejected',
      active: statusFilter === 'rejected',
      onClick: () => setFilter('status', 'rejected'),
    },
    {
      label: 'All Changes',
      key: 'all',
      active: statusFilter === 'all',
      onClick: () => setFilter('status', 'all'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Staged Changes & Ingestion Queue</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Review automated CRICOS updates and AI-extracted curriculum changes before publishing to production.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={changes}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search staged changes by external key or entity..."
        presetViews={presetViews}
        filters={
          <>
            <DataTableFacetedFilter
              title="Entity"
              options={ENTITY_TYPES}
              value={entityTypeFilter}
              onSelect={(v) => setFilter('entityType', v || 'all')}
            />
            <DataTableFacetedFilter
              title="Status"
              options={STATUSES}
              value={statusFilter}
              onSelect={(v) => setFilter('status', v || 'all')}
            />
          </>
        }
        activeFilterCount={(entityTypeFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        bulkActions={[
          {
            label: 'Bulk Approve',
            icon: CheckCircle2,
            variant: 'default',
            confirmTitle: 'Bulk Approve Staged Changes',
            confirmDescription: 'Are you sure you want to approve and publish the selected staged changes to production?',
            onExecute: async (ids) => {
              await bulkApproveMutation.mutateAsync(ids);
            },
          },
          {
            label: 'Bulk Reject',
            icon: XCircle,
            isDestructive: true,
            confirmTitle: 'Bulk Reject Staged Changes',
            confirmDescription: 'Are you sure you want to reject the selected staged changes?',
            onExecute: async (ids) => {
              await bulkRejectMutation.mutateAsync(ids);
            },
          },
        ]}
      />

      {inspectChange && (
        <Dialog open={!!inspectChange} onOpenChange={() => setInspectChange(null)}>
          <DialogContent className="max-w-3xl bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl p-6 max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold font-display text-foreground">
                Inspect Staged Change: {inspectChange.entityName || inspectChange.externalKey}
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <DiffViewer
                diff={inspectChange.diff}
                oldValue={inspectChange.oldValue}
                newValue={inspectChange.newValue || {}}
              />
            </div>
            <DialogFooter className="gap-2 pt-3 border-t border-border/60">
              <Button variant="outline" size="sm" onClick={() => setInspectChange(null)} className="rounded-xl">
                Close
              </Button>
              {inspectChange.status === 'pending' && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      rejectMutation.mutate(inspectChange._id);
                    }}
                    className="rounded-xl"
                  >
                    Reject Change
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      approveMutation.mutate(inspectChange._id);
                    }}
                    className="rounded-xl font-semibold"
                  >
                    Approve & Publish
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
