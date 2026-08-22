'use client';

import * as React from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  GraduationCap,
  ShieldCheck,
  Building2,
  Plus,
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
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

const LEVELS = [
  { label: 'All Levels', value: 'all' },
  { label: 'Bachelor', value: 'bachelor' },
  { label: 'Master', value: 'master' },
  { label: 'PhD / Doctorate', value: 'phd' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'Graduate Certificate', value: 'graduate_certificate' },
];

export function ProgramTable() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteName, setDeleteName] = React.useState('');

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

  const levelFilter = searchParams.get('level') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-programs', { debouncedSearch, levelFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      programsApi.getAll({
        search: debouncedSearch || undefined,
        level: levelFilter !== 'all' ? levelFilter : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }),
  });

  const programs: Program[] = response?.data?.programs || [];
  const meta = response?.data?.pagination;
  const total = meta?.total || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsApi.delete(id),
    onSuccess: () => {
      toast.success('Program deleted successfully');
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete program'),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => programsApi.delete(id))),
    onSuccess: () => {
      toast.success('Selected programs deleted');
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
    },
    onError: () => toast.error('Bulk deletion failed'),
  });

  const columns: ColumnDef<Program>[] = React.useMemo(
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
            title="Program Name & Provider"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const prog = row.original;
          const uni: any = prog.university;
          const uniName = typeof uni === 'object' && uni ? uni.name : (prog as any).universityName || 'University';
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                <BookOpen className="h-4 w-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/admin/programs/${prog._id}/edit`}
                  className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors truncate block"
                >
                  {prog.name}
                </Link>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                  <span>{uniName}</span>
                  {prog.cricosCourseCode && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 bg-teal-500/10 text-teal-300 border-teal-500/20 font-mono">
                      CRICOS: {prog.cricosCourseCode}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'level',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Level"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize font-semibold bg-surface-elevated text-foreground">
            {row.original.level || 'Master'}
          </Badge>
        ),
      },
      {
        accessorKey: 'fieldOfStudy',
        header: 'Field of Study',
        cell: ({ row }) => (
          <span className="text-xs text-foreground font-medium truncate max-w-[160px] block">
            {(row.original as any).fieldOfStudy || (row.original as any).field || 'General Studies'}
          </span>
        ),
      },
      {
        accessorKey: 'primaryFeeAnnualAud',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Annual Fee (AUD)"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const fee = (row.original as any).primaryFeeAnnualAud || (row.original as any).tuitionFeeAud || (row.original as any).tuitionFeeInternational || 0;
          return (
            <div className="font-mono text-xs font-semibold text-foreground">
              {fee ? `$${fee.toLocaleString()} AUD` : 'Contact provider'}
            </div>
          );
        },
      },
      {
        id: 'next_intake',
        header: 'Next Intake',
        cell: ({ row }) => {
          const intake = (row.original as any).intakes?.[0] || (row.original as any).intakeMonths?.[0] || 'Feb 2027';
          return (
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-purple-400 shrink-0" />
              <span>{intake}</span>
            </div>
          );
        },
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
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const prog = row.original;
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                asChild
                title="Edit Program"
              >
                <Link href={`/admin/programs/${prog._id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400"
                onClick={() => {
                  setDeleteId(prog._id);
                  setDeleteName(prog.name);
                }}
                title="Delete Program"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Programs',
      key: 'all',
      active: levelFilter === 'all',
      onClick: () => setFilter('level', 'all'),
    },
    {
      label: 'Master Degrees',
      key: 'master',
      active: levelFilter === 'master',
      onClick: () => setFilter('level', 'master'),
    },
    {
      label: 'Bachelor Degrees',
      key: 'bachelor',
      active: levelFilter === 'bachelor',
      onClick: () => setFilter('level', 'bachelor'),
    },
  ];

  return (
    <>
      <AdminDataTable
        columns={columns}
        data={programs}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by program name, provider, or CRICOS..."
        presetViews={presetViews}
        filters={
          <DataTableFacetedFilter
            title="Level"
            options={LEVELS}
            value={levelFilter}
            onSelect={(v) => setFilter('level', v || 'all')}
          />
        }
        activeFilterCount={levelFilter !== 'all' ? 1 : 0}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        toolbarActions={
          <Button size="sm" asChild className="h-8 text-xs rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground">
            <Link href="/admin/programs/new">
              <Plus className="h-3.5 w-3.5" />
              <span>Add Program</span>
            </Link>
          </Button>
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            icon: Trash2,
            isDestructive: true,
            confirmTitle: 'Delete Selected Programs',
            confirmDescription:
              'Are you sure you want to permanently delete the selected programs? This action cannot be undone.',
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
        title="Delete Program"
        description={`Are you sure you want to delete "${deleteName}"?`}
        loading={deleteMutation.isPending}
      />
    </>
  );
}
