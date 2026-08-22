'use client';

import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Trophy,
  Trash2,
  Plus,
  Pencil,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminDataTable, PresetView } from '@/components/admin/table/AdminDataTable';
import { DataTableColumnHeader } from '@/components/admin/table/DataTableColumnHeader';
import { DataTableFacetedFilter } from '@/components/admin/table/DataTableFacetedFilter';
import { useDataTableState } from '@/components/admin/table/useDataTableState';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';

const SOURCES = [
  { label: 'All Publishers', value: 'all' },
  { label: 'QS World Rankings', value: 'QS' },
  { label: 'Times Higher Education (THE)', value: 'THE' },
  { label: 'Academic Ranking of World Universities (ARWU)', value: 'ARWU' },
];

export default function AdminRankingsPage() {
  const qc = useQueryClient();
  const [editingRank, setEditingRank] = React.useState<any>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [recheckingId, setRecheckingId] = React.useState<string | null>(null);
  const [addFormData, setAddFormData] = React.useState<any>({ source: 'QS', year: new Date().getFullYear() });

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
    defaultSortBy: 'year',
    defaultSortOrder: 'desc',
  });

  const sourceFilter = searchParams.get('source') || 'all';

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-rankings', { debouncedSearch, sourceFilter, page, limit, sortBy, sortOrder }],
    queryFn: () =>
      api.get('/admin/rankings', {
        params: {
          q: debouncedSearch || undefined,
          source: sourceFilter !== 'all' ? sourceFilter : undefined,
          page,
          limit,
          sortBy,
          sortOrder,
        },
      }).then((r) => r.data),
  });

  const { data: universitiesRes } = useQuery({
    queryKey: ['admin-rankings-universities'],
    queryFn: () => api.get('/admin/universities', { params: { limit: 200 } }).then((r) => r.data),
    enabled: isAdding,
  });

  const universities = universitiesRes?.data || [];
  const rankings: any[] = response?.data || [];
  const total = response?.meta?.total || rankings.length;

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/admin/rankings', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking record created');
      setIsAdding(false);
      setAddFormData({ source: 'QS', year: new Date().getFullYear() });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create ranking'),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/admin/rankings/${data._id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking updated');
      setEditingRank(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update ranking'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/rankings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking record deleted');
      setDeleteId(null);
    },
  });

  const recheckMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/rankings/${id}/recheck`),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success(res.data.message || 'Ranking enriched via AI');
      setRecheckingId(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to enrich');
      setRecheckingId(null);
    },
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
        accessorKey: 'university',
        header: 'Institution',
        cell: ({ row }) => {
          const uni = row.original.university || row.original.universityId;
          const uniName = typeof uni === 'object' && uni ? uni.name : 'Australian University';
          return (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-card dark:bg-slate-800 border border-border/80 flex items-center justify-center shrink-0">
                <Trophy className="h-4 w-4 text-amber-400" />
              </div>
              <span className="font-bold text-xs sm:text-sm text-foreground">{uniName}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'source',
        header: 'Publisher',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold bg-purple-500/10 text-purple-300 border-purple-500/20">
            {row.original.source}
          </Badge>
        ),
      },
      {
        accessorKey: 'globalRank',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Global Rank"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => {
          const rank = row.original.globalRank;
          return (
            <div className="font-mono font-bold text-sm text-foreground">
              {rank ? `#${rank}` : 'Unranked'}
            </div>
          );
        },
      },
      {
        accessorKey: 'year',
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title="Edition Year"
            currentSortBy={sortBy}
            currentSortOrder={sortOrder}
            onSort={setSorting}
          />
        ),
        cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.year}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Verification',
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] bg-teal-500/10 text-teal-300 border-teal-500/20 capitalize font-semibold">
            ● {row.original.status || 'approved'}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const rank = row.original;
          const isRechecking = recheckingId === rank._id;
          return (
            <div className="flex items-center gap-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-purple-400"
                onClick={() => {
                  setRecheckingId(rank._id);
                  recheckMutation.mutate(rank._id);
                }}
                disabled={isRechecking}
                title="AI Verification"
              >
                {isRechecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
                onClick={() => setEditingRank(rank)}
                title="Edit Ranking"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-rose-400"
                onClick={() => setDeleteId(rank._id)}
                title="Delete Record"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        },
      },
    ],
    [sortBy, sortOrder, setSorting, recheckingId]
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">Global University Rankings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage QS, Times Higher Education, and ARWU publisher rankings with AI-assisted verification.
        </p>
      </div>

      <AdminDataTable
        columns={columns}
        data={rankings}
        page={page}
        limit={limit}
        total={total}
        isLoading={isLoading}
        isError={isError}
        errorMessage={(error as any)?.message}
        onRetry={() => refetch()}
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search ranking records by university or publisher..."
        filters={
          <DataTableFacetedFilter
            title="Publisher"
            options={SOURCES}
            value={sourceFilter}
            onSelect={(v) => setFilter('source', v || 'all')}
          />
        }
        activeFilterCount={sourceFilter !== 'all' ? 1 : 0}
        onResetFilters={resetFilters}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={setSorting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        toolbarActions={
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-8 text-xs rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Ranking</span>
          </Button>
        }
        bulkActions={[
          {
            label: 'AI Recheck Selected',
            icon: Sparkles,
            variant: 'outline',
            onExecute: async (ids) => {
              await Promise.all(ids.map((id) => api.post(`/admin/rankings/${id}/recheck`)));
              qc.invalidateQueries({ queryKey: ['admin-rankings'] });
              toast.success('AI enrichment triggered for selected rankings');
            },
          },
        ]}
      />

      {/* Add Dialog */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-foreground">
              Add New University Ranking
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div>
              <Label className="text-xs">University</Label>
              <Select
                value={addFormData.universityId}
                onValueChange={(val) => setAddFormData({ ...addFormData, universityId: val })}
              >
                <SelectTrigger className="h-9 text-xs mt-1 rounded-xl">
                  <SelectValue placeholder="Select Institution" />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {universities.map((u: any) => (
                    <SelectItem key={u._id} value={u._id} className="text-xs">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Publisher</Label>
                <Select
                  value={addFormData.source}
                  onValueChange={(val) => setAddFormData({ ...addFormData, source: val })}
                >
                  <SelectTrigger className="h-9 text-xs mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QS">QS</SelectItem>
                    <SelectItem value="THE">THE</SelectItem>
                    <SelectItem value="ARWU">ARWU</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Input
                  type="number"
                  value={addFormData.year}
                  onChange={(e) => setAddFormData({ ...addFormData, year: parseInt(e.target.value) })}
                  className="h-9 text-xs mt-1 rounded-xl"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs">Global Rank</Label>
              <Input
                type="number"
                value={addFormData.globalRank || ''}
                onChange={(e) => setAddFormData({ ...addFormData, globalRank: parseInt(e.target.value) })}
                className="h-9 text-xs mt-1 rounded-xl"
                placeholder="e.g. 19"
              />
            </div>
          </div>
          <DialogFooter className="pt-3 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setIsAdding(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createMutation.mutate(addFormData)}
              disabled={createMutation.isPending || !addFormData.universityId}
              className="rounded-xl font-semibold"
            >
              {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Save Ranking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRank} onOpenChange={() => setEditingRank(null)}>
        <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-foreground">Edit Ranking Record</DialogTitle>
          </DialogHeader>
          {editingRank && (
            <div className="space-y-3 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Global Rank</Label>
                  <Input
                    type="number"
                    value={editingRank.globalRank || ''}
                    onChange={(e) => setEditingRank({ ...editingRank, globalRank: parseInt(e.target.value) })}
                    className="h-9 text-xs mt-1 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs">Year</Label>
                  <Input
                    type="number"
                    value={editingRank.year || ''}
                    onChange={(e) => setEditingRank({ ...editingRank, year: parseInt(e.target.value) })}
                    className="h-9 text-xs mt-1 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="pt-3 border-t border-border/60">
            <Button variant="outline" size="sm" onClick={() => setEditingRank(null)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => updateMutation.mutate(editingRank)}
              disabled={updateMutation.isPending}
              className="rounded-xl font-semibold"
            >
              {updateMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
              Update Ranking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Ranking Record"
        description="Are you sure you want to remove this ranking record?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
