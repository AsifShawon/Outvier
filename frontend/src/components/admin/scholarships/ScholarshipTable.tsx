'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  GraduationCap,
  Pencil,
  Trash2,
  Archive,
  RotateCcw,
  Calendar,
  DollarSign,
  Plus,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { adminScholarshipsApi } from '@/lib/api/scholarships.api';
import { Scholarship } from '@/types/scholarship';
import { format } from 'date-fns';

const STATUSES = [
  { label: 'All Statuses', value: 'all' },
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
  { label: 'Archived', value: 'archived' },
  { label: 'Expired', value: 'expired' },
];

export function ScholarshipTable() {
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
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const statusFilter = searchParams.get('status') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-scholarships', { debouncedSearch, statusFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      adminScholarshipsApi.getScholarships({
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        limit,
      }),
  });

  const rawData = response?.data?.data;
  const scholarships: Scholarship[] = Array.isArray(rawData) ? rawData : [];
  const total = (response?.data as any)?.meta?.total || scholarships.length;

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminScholarshipsApi.archiveScholarship(id),
    onSuccess: () => {
      toast.success('Scholarship archived');
      qc.invalidateQueries({ queryKey: ['admin-scholarships'] });
    },
    onError: () => toast.error('Failed to archive scholarship'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => adminScholarshipsApi.restoreScholarship(id),
    onSuccess: () => {
      toast.success('Scholarship restored to draft');
      qc.invalidateQueries({ queryKey: ['admin-scholarships'] });
    },
    onError: () => toast.error('Failed to restore scholarship'),
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => adminScholarshipsApi.archiveScholarship(id))),
    onSuccess: () => {
      toast.success('Selected scholarships archived');
      qc.invalidateQueries({ queryKey: ['admin-scholarships'] });
    },
    onError: () => toast.error('Bulk archive failed'),
  });

  const columns: ColumnDef<Scholarship>[] = React.useMemo(
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
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Scholarship Title & Provider"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const sch = row.original;
          const uniName =
            (sch as any).universityName ||
            (typeof sch.linkedUniversity === 'object' && sch.linkedUniversity
              ? sch.linkedUniversity.name
              : 'Australian University');
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                <GraduationCap className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/scholarships/${sch._id}/edit`}
                  className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate block"
                >
                  {sch.title}
                </Link>
                <p className="text-[11px] text-muted-foreground truncate">{uniName}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'amount',
        header: 'Amount / Coverage',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold bg-teal-500/10 text-teal-300 border-teal-500/20">
            {(row.original as any).amount || row.original.benefits || '$10,000 AUD'}
          </Badge>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground capitalize">
            {(row.original as any).type || (row.original as any).category || 'Merit-Based'}
          </span>
        ),
      },
      {
        accessorKey: 'deadline',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Deadline"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const dl = (row.original as any).deadline || row.original.deadlineDate;
          return (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-purple-400 shrink-0" />
              <span>{dl ? format(new Date(dl), 'MMM d, yyyy') : 'Rolling Intake'}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'published';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                status === 'published'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : status === 'archived'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-muted text-muted-foreground border-border'
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
          const sch = row.original;
          const isArchived = sch.status === 'archived';
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                asChild
                title="Edit Scholarship"
              >
                <Link href={`/admin/scholarships/${sch._id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>

              {isArchived ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-teal-400"
                  onClick={() => restoreMutation.mutate(sch._id)}
                  title="Restore Scholarship"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400"
                  onClick={() => archiveMutation.mutate(sch._id)}
                  title="Archive Scholarship"
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting, archiveMutation, restoreMutation]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Scholarships',
      key: 'all',
      active: statusFilter === 'all',
      onClick: () => setFilter('status', 'all'),
    },
    {
      label: 'Published',
      key: 'published',
      active: statusFilter === 'published',
      onClick: () => setFilter('status', 'published'),
    },
    {
      label: 'Drafts',
      key: 'draft',
      active: statusFilter === 'draft',
      onClick: () => setFilter('status', 'draft'),
    },
    {
      label: 'Archived',
      key: 'archived',
      active: statusFilter === 'archived',
      onClick: () => setFilter('status', 'archived'),
    },
  ];

  return (
    <AdminDataTable
      columns={columns}
      data={scholarships}
      page={page}
      limit={limit}
      total={total}
      isLoading={isLoading}
      isError={isError}
      errorMessage={(error as any)?.message}
      onRetry={() => refetch()}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search scholarships by title or provider..."
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
        <Button size="sm" asChild className="h-8 text-xs rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground">
          <Link href="/admin/scholarships/create">
            <Plus className="h-3.5 w-3.5" />
            <span>Create Scholarship</span>
          </Link>
        </Button>
      }
      bulkActions={[
        {
          label: 'Archive Selected',
          icon: Archive,
          isDestructive: true,
          confirmTitle: 'Archive Selected Scholarships',
          confirmDescription:
            'Are you sure you want to archive the selected scholarships? They will be hidden from student search.',
          onExecute: async (ids) => {
            await bulkArchiveMutation.mutateAsync(ids);
          },
        },
      ]}
    />
  );
}
