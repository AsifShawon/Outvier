'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin.api';
import { format } from 'date-fns';
import {
  Users,
  Shield,
  UserCheck,
  Mail,
  Calendar,
  Lock,
  Search,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';

const ROLES = [
  { label: 'All Roles', value: 'all' },
  { label: 'Administrators', value: 'admin' },
  { label: 'Students', value: 'user' },
];

export default function AdminUsersPage() {
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

  const roleFilter = searchParams.get('role') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-users', { debouncedSearch, roleFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      adminApi.getUsers({
        q: debouncedSearch || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        page,
        limit,
        sortBy,
        sortOrder,
      }).then((r) => r.data),
  });

  const users: any[] = response?.data || [];
  const meta = response?.meta;
  const total = meta?.total || users.length;

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
        accessorKey: 'username',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="User Profile"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const user = row.original;
          const isAdmin = user.role === 'admin';
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                {isAdmin ? <Shield className="h-4 w-4 text-purple-400" /> : <Users className="h-4 w-4 text-teal-400" />}
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-foreground">
                  {user.name || user.username}
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">@{user.username}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        header: 'Email Address',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{row.original.email}</span>
          </div>
        ),
      },
      {
        accessorKey: 'role',
        header: 'Role & Privileges',
        cell: ({ row }) => {
          const role = row.original.role || 'user';
          return (
            <Badge
              variant="outline"
              className={`text-[10px] font-bold capitalize ${
                role === 'admin'
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                  : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
              }`}
            >
              {role === 'admin' ? '● System Admin' : '● Student'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Registered Date"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => (
          <span className="text-[11px] text-muted-foreground font-mono">
            {row.original.createdAt ? format(new Date(row.original.createdAt), 'MMM d, yyyy') : '-'}
          </span>
        ),
      },
    ],
    [sortBy, sortOrder, setSorting]
  );

  const presetViews: PresetView[] = [
    {
      label: 'All Users',
      key: 'all',
      active: roleFilter === 'all',
      onClick: () => setFilter('role', 'all'),
    },
    {
      label: 'Administrators',
      key: 'admin',
      active: roleFilter === 'admin',
      onClick: () => setFilter('role', 'admin'),
    },
    {
      label: 'Students',
      key: 'user',
      active: roleFilter === 'user',
      onClick: () => setFilter('role', 'user'),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">User Management</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage system administrators, staff privileges, and registered student accounts.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={users}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search users by username, email, or name..."
        presetViews={presetViews}
        filters={
          <DataTableFacetedFilter
            title="Role"
            options={ROLES}
            value={roleFilter}
            onSelect={(v) => setFilter('role', v || 'all')}
          />
        }
        activeFilterCount={roleFilter !== 'all' ? 1 : 0}
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
