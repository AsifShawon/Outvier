'use client';

import * as React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  RowSelectionState,
  VisibilityState,
} from '@tanstack/react-table';
import { Search, RotateCw, AlertCircle, RefreshCw, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTableColumnVisibility } from './DataTableColumnVisibility';
import { DataTablePagination } from './DataTablePagination';
import { DataTableBulkBar, BulkAction } from './DataTableBulkBar';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableEmptyState } from './DataTableEmptyState';
import { DataTableFilterDrawer } from './DataTableFilterDrawer';
import { cn } from '@/lib/utils';

export interface PresetView {
  label: string;
  key: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}

export interface AdminDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  page?: number;
  limit?: number;
  total?: number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;

  // Search
  search?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;

  // Filters & Presets
  filters?: React.ReactNode;
  activeFilterCount?: number;
  onResetFilters?: () => void;
  presetViews?: PresetView[];

  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (columnId: string, order?: 'asc' | 'desc') => void;

  // Pagination
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  pageSizeOptions?: number[];

  // Bulk Actions & Selection
  bulkActions?: BulkAction[];
  getRowId?: (row: TData) => string;

  // Empty State
  emptyTitle?: string;
  emptyDescription?: string;

  // Mobile
  mobileCardRender?: (row: TData) => React.ReactNode;

  // Extra Toolbar Actions
  toolbarActions?: React.ReactNode;
}

export function AdminDataTable<TData, TValue>({
  columns,
  data,
  page = 1,
  limit = 20,
  total = 0,
  isLoading = false,
  isError = false,
  errorMessage = 'Failed to load records from server.',
  onRetry,

  search = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',

  filters,
  activeFilterCount = 0,
  onResetFilters,
  presetViews,

  sortBy,
  sortOrder,
  onSort,

  onPageChange,
  onLimitChange,
  pageSizeOptions,

  bulkActions = [],
  getRowId,

  emptyTitle,
  emptyDescription,
  mobileCardRender,
  toolbarActions,
}: AdminDataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const table = useReactTable({
    data,
    columns,
    state: {
      rowSelection,
      columnVisibility,
    },
    enableRowSelection: bulkActions.length > 0,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: totalPages,
    getRowId: getRowId || ((row: any) => row._id || row.id || String(Math.random())),
  });

  const selectedRowIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  // Clear selection when data changes
  React.useEffect(() => {
    setRowSelection({});
  }, [page, limit, search, sortBy, sortOrder]);

  return (
    <div className="space-y-4">
      {/* 1. Presets View Bar (if provided) */}
      {presetViews && presetViews.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {presetViews.map((preset) => (
            <Button
              key={preset.key}
              variant={preset.active ? 'default' : 'outline'}
              size="sm"
              onClick={preset.onClick}
              className={cn(
                'h-8 text-xs font-semibold rounded-xl whitespace-nowrap transition-all',
                preset.active
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-card dark:bg-slate-900 border-border/80 dark:border-slate-800 text-muted-foreground hover:text-foreground'
              )}
            >
              <span>{preset.label}</span>
              {preset.count !== undefined && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'ml-1.5 px-1.5 py-0 text-[10px] rounded-md font-bold',
                    preset.active ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {preset.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      {/* 2. Bulk Action Bar (Visible when ≥ 1 row is selected) */}
      {bulkActions.length > 0 && (
        <DataTableBulkBar
          selectedIds={selectedRowIds}
          onClearSelection={() => setRowSelection({})}
          actions={bulkActions}
          isPending={isLoading}
        />
      )}

      {/* 3. Toolbar Above Headers */}
      <div className="bg-card dark:bg-[#121929] border border-border/80 dark:border-slate-800/80 rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Left: Search & Desktop Filter Row */}
        <div className="flex items-center gap-2.5 flex-1 flex-wrap">
          {onSearchChange && (
            <div className="relative w-full sm:w-64 md:w-72">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-8 text-xs rounded-xl bg-background/80 dark:bg-slate-900/90 border-border/80 dark:border-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Desktop Filter Slot */}
          <div className="hidden md:flex items-center gap-2 flex-wrap">{filters}</div>

          {/* Mobile Filter Drawer */}
          {filters && (
            <DataTableFilterDrawer
              activeFilterCount={activeFilterCount}
              onResetFilters={onResetFilters}
            >
              {filters}
            </DataTableFilterDrawer>
          )}

          {/* Reset Filters Shortcut */}
          {activeFilterCount > 0 && onResetFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="h-8 text-xs text-rose-400 hover:text-rose-300 hidden md:flex items-center gap-1 px-2"
            >
              <RotateCw className="h-3 w-3" />
              Reset
            </Button>
          )}
        </div>

        {/* Right: Column Visibility, Custom Toolbar Actions & Refresh */}
        <div className="flex items-center gap-2 justify-end">
          {toolbarActions}
          <DataTableColumnVisibility table={table} />
        </div>
      </div>

      {/* 4. Table Container */}
      <div className="rounded-2xl border border-border/80 dark:border-slate-800/80 overflow-hidden bg-card dark:bg-[#121929] shadow-xs">
        {isLoading ? (
          <DataTableSkeleton columnCount={columns.length} rowCount={limit > 10 ? 10 : limit} />
        ) : isError ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 mx-auto">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-foreground">Failed to load records</h4>
              <p className="text-xs text-muted-foreground">{errorMessage}</p>
            </div>
            {onRetry && (
              <Button size="sm" onClick={onRetry} className="text-xs rounded-xl h-8 gap-1.5 font-semibold">
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        ) : data.length === 0 ? (
          <DataTableEmptyState
            title={emptyTitle}
            description={emptyDescription}
            onResetFilters={activeFilterCount > 0 || search ? onResetFilters : undefined}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30 dark:bg-slate-900/60 border-b border-border/60 dark:border-slate-800">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="h-10 px-4 text-xs font-bold uppercase tracking-wider text-muted-foreground"
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="divide-y divide-border/40 dark:divide-slate-800/60">
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="hover:bg-muted/20 dark:hover:bg-slate-800/40 transition-colors h-12 data-[state=selected]:bg-purple-500/5 dark:data-[state=selected]:bg-purple-950/20"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-2.5 text-xs text-foreground">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card Representation (if provided or fallback) */}
            <div className="block sm:hidden divide-y divide-border/40 dark:divide-slate-800/60">
              {data.map((item, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  {mobileCardRender ? (
                    mobileCardRender(item)
                  ) : (
                    <div className="space-y-1">
                      {table
                        .getRowModel()
                        .rows[idx]?.getVisibleCells()
                        .map((cell) => (
                          <div key={cell.id} className="flex justify-between items-center text-xs py-1">
                            <span className="font-semibold text-muted-foreground">
                              {String(cell.column.id)}:
                            </span>
                            <span>{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 5. Pagination Footer */}
            {onPageChange && onLimitChange && (
              <DataTablePagination
                page={page}
                limit={limit}
                total={total}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                pageSizeOptions={pageSizeOptions}
                isPending={isLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
