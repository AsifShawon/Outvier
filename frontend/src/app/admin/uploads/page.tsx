'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { CsvUploader } from '@/components/admin/CsvUploader';
import { adminApi } from '@/lib/api/admin.api';
import { UploadJob } from '@/types/api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, FileText, Upload, Database } from 'lucide-react';
import { AdminDataTable } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { format } from 'date-fns';

const statusIcon = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />,
  failed: <AlertCircle className="h-3.5 w-3.5 text-rose-400" />,
  processing: <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
  pending: <Clock className="h-3.5 w-3.5 text-muted-foreground" />,
};

export default function AdminUploadsPage() {
  const {
    page,
    limit,
    sortBy,
    sortOrder,
    search,
    debouncedSearch,
    setPage,
    setLimit,
    setSorting,
    setSearch,
  } = useDataTableState({
    defaultSortBy: 'createdAt',
    defaultSortOrder: 'desc',
  });

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['upload-history'],
    queryFn: adminApi.getUploadHistory,
    refetchInterval: 5000,
  });

  const jobs: UploadJob[] = response?.data?.data || [];
  const filteredJobs = jobs.filter((j) => {
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return j.filename.toLowerCase().includes(q) || j.entity.toLowerCase().includes(q);
    }
    return true;
  });

  const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);
  const total = filteredJobs.length;

  const columns: ColumnDef<UploadJob>[] = React.useMemo(
    () => [
      {
        accessorKey: 'filename',
        header: 'File Name',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-purple-400" />
            </div>
            <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[240px]">
              {row.original.filename}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'entity',
        header: 'Entity Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] capitalize font-semibold bg-surface-elevated">
            {row.original.entity}
          </Badge>
        ),
      },
      {
        id: 'rows',
        header: 'Imported Rows',
        cell: ({ row }) => {
          const job = row.original;
          return (
            <span className="font-mono text-xs text-foreground font-semibold">
              {job.successCount} / {job.totalRows}
            </span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'completed';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize flex items-center gap-1 w-fit ${
                status === 'completed'
                  ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  : status === 'failed'
                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}
            >
              {statusIcon[status as keyof typeof statusIcon]}
              <span>{status}</span>
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Uploaded Date"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground font-mono">
            {format(new Date(row.original.createdAt), 'MMM d, yyyy HH:mm')}
          </span>
        ),
      },
    ],
    [sortBy, sortOrder, setSorting]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">CSV Bulk Import & History</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Import universities and programs in bulk from structured CSV files with validation.
        </p>
      </div>

      {/* Uploaders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border/80 dark:border-slate-800/80 bg-card dark:bg-[#121929] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-base text-foreground">Universities CSV</h2>
          </div>
          <CsvUploader entity="universities" />
        </div>

        <div className="rounded-3xl border border-border/80 dark:border-slate-800/80 bg-card dark:bg-[#121929] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-purple-400" />
            <h2 className="font-bold text-base text-foreground">Programs CSV</h2>
          </div>
          <CsvUploader entity="programs" />
        </div>
      </div>

      {/* Upload History Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-display text-foreground">Upload Execution History</h3>
        <AdminDataTable
          columns={columns}
          data={paginatedJobs}
          page={page}
          limit={limit}
          total={total}
          isLoading={isLoading}
          isError={isError}
          errorMessage={(error as any)?.message}
          onRetry={() => refetch()}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search upload jobs by filename or entity..."
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </div>
  );
}
