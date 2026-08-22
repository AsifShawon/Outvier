'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { format } from 'date-fns';
import {
  FileText,
  Building2,
  Calendar,
  Clock,
  Compass,
  Bookmark,
  FileCheck,
  Send,
  Award,
  Plane,
  User,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';

const STAGES = [
  { label: 'All Stages', value: 'all' },
  { label: 'Researching', value: 'researching' },
  { label: 'Shortlisted', value: 'shortlisted' },
  { label: 'Preparing Docs', value: 'preparing' },
  { label: 'Applied / Submitted', value: 'applied' },
  { label: 'Offer Received', value: 'offer' },
  { label: 'Onboarding', value: 'onboarding' },
];

export default function AdminApplicationsPage() {
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
    defaultSortBy: 'updatedAt',
    defaultSortOrder: 'desc',
  });

  const stageFilter = searchParams.get('stage') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-applications', { debouncedSearch, stageFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      adminApi.getApplications({
        q: debouncedSearch || undefined,
        stage: stageFilter !== 'all' ? stageFilter : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }).then((r) => r.data),
  });

  const applications: any[] = response?.data || [];
  const meta = response?.meta;
  const total = meta?.total || applications.length;

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
        accessorKey: 'title',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Program & Institution"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const app = row.original;
          const uni = app.universityId;
          const uniName = typeof uni === 'object' && uni ? uni.name : app.customUniversityName || 'Australian University';
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm text-foreground truncate">{app.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{uniName}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'userId',
        header: 'Applicant Student',
        cell: ({ row }) => {
          const user = row.original.userId;
          const name = typeof user === 'object' && user ? user.name || user.username : 'Student';
          const email = typeof user === 'object' && user ? user.email : '';
          return (
            <div className="min-w-0">
              <p className="font-semibold text-xs text-foreground truncate">{name}</p>
              {email && <p className="text-[10px] text-muted-foreground font-mono truncate">{email}</p>}
            </div>
          );
        },
      },
      {
        accessorKey: 'columnId',
        header: 'Admission Stage',
        cell: ({ row }) => {
          const stage = (row.original.columnId || 'researching').toLowerCase();
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                stage === 'offer'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : stage === 'applied'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : stage === 'preparing'
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-muted text-muted-foreground border-border'
              }`}
            >
              ● {stage}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'intake',
        header: 'Intake / Target',
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.intake || 'Feb 2027'}</span>
        ),
      },
      {
        id: 'documents',
        header: 'Checklist',
        cell: ({ row }) => {
          const docs = row.original.documentChecklist || [];
          const uploaded = docs.filter((d: any) => ['uploaded', 'verified', 'completed'].includes(d.status)).length;
          return (
            <span className="font-mono text-xs text-foreground">
              {uploaded} / {docs.length} docs
            </span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Last Activity"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground font-mono">
            {row.original.updatedAt ? format(new Date(row.original.updatedAt), 'MMM d, yyyy') : '-'}
          </span>
        ),
      },
    ],
    [sortBy, sortOrder, setSorting]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Applications',
      key: 'all',
      active: stageFilter === 'all',
      onClick: () => setFilter('stage', 'all'),
    },
    {
      label: 'Preparing Docs',
      key: 'preparing',
      active: stageFilter === 'preparing',
      onClick: () => setFilter('stage', 'preparing'),
    },
    {
      label: 'Applied / Submitted',
      key: 'applied',
      active: stageFilter === 'applied',
      onClick: () => setFilter('stage', 'applied'),
    },
    {
      label: 'Offer Received',
      key: 'offer',
      active: stageFilter === 'offer',
      onClick: () => setFilter('stage', 'offer'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Student Applications Overview</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Monitor application workflows, document checklist statuses, and offer conversions across all student accounts.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={applications}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search applications by program or institution..."
        presetViews={presetViews}
        filters={
          <DataTableFacetedFilter
            title="Stage"
            options={STAGES}
            value={stageFilter}
            onSelect={(v) => setFilter('stage', v || 'all')}
          />
        }
        activeFilterCount={stageFilter !== 'all' ? 1 : 0}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
      />
    </div>
  );
}
