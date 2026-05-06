'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';
import { Pagination } from '@/components/ui-custom/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { universitiesApi } from '@/lib/api/universities.api';
import { cricosApi } from '@/lib/api/cricos.api';
import { University } from '@/types/university';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2, Clock, Play, RefreshCw, XCircle, Loader2, MapPin, Award, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export function UniversityTable() {
  const router = useRouter();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [state, setState] = useState('all');
  const [rankingBand, setRankingBand] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 350);

  const bulkSyncMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => cricosApi.syncUniversity(id))),
    onSuccess: () => {
      toast.success('Bulk sync jobs triggered');
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
    },
    onError: () => toast.error('Bulk sync failed'),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(universities.map(u => u._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-universities', { search: debouncedSearch, state, rankingBand, status, page, limit }],
    queryFn: () => universitiesApi.getAll({ 
      q: debouncedSearch,
      state: state !== 'all' ? state : undefined,
      rankingBand: rankingBand !== 'all' ? rankingBand : undefined,
      status: status !== 'all' ? status : undefined,
      page, 
      limit 
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => universitiesApi.delete(id),
    onSuccess: () => {
      toast.success('University deleted');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete university'),
  });

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
    }
  });

  const handleSync = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSyncingId(id);
    syncMutation.mutate(id);
  };

  const universities: University[] = data?.data?.data || [];
  const meta = data?.data?.meta;

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === 'search') setSearch(value);
    if (key === 'state') setState(value);
    if (key === 'rankingBand') setRankingBand(value);
    if (key === 'status') setStatus(value);
  };

  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'synced': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'changes_pending': return <Clock className="h-3.5 w-3.5 text-amber-500" />;
      case 'failed': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search universities..."
            className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          {selectedIds.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/5 gap-2"
              onClick={() => bulkSyncMutation.mutate(Array.from(selectedIds))}
              disabled={bulkSyncMutation.isPending}
            >
              {bulkSyncMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Sync Selected ({selectedIds.size})
            </Button>
          )}
          <Select value={state} onValueChange={(v) => handleFilterChange('state', v)}>
            <SelectTrigger className="w-[140px] h-9">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <SelectValue placeholder="All States" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'].map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={rankingBand} onValueChange={(v) => handleFilterChange('rankingBand', v)}>
            <SelectTrigger className="w-[140px] h-9">
              <Award className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <SelectValue placeholder="Ranking" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rankings</SelectItem>
              <SelectItem value="top50">Top 50</SelectItem>
              <SelectItem value="top100">Top 100</SelectItem>
              <SelectItem value="top200">Top 200</SelectItem>
              <SelectItem value="top500">Top 500</SelectItem>
              <SelectItem value="unranked">Unranked</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[130px] h-9">
              <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/universities/new">
          <Button size="sm" className="gap-2 h-9">
            <Plus className="h-3.5 w-3.5" />
            Add University
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 text-[11px] uppercase tracking-wider">
              <TableHead className="w-[40px]">
                <Checkbox 
                  checked={universities.length > 0 && selectedIds.size === universities.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[220px]">University</TableHead>
              <TableHead>CRICOS Code</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Ranking</TableHead>
              <TableHead>Programs</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : universities.map((uni) => (
                  <TableRow key={uni._id} className="hover:bg-muted/30 group">
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.has(uni._id)}
                        onCheckedChange={() => toggleSelect(uni._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1">{uni.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{uni.shortName || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{uni.cricosProviderCode || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{uni.state}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {uni.ranking ? (
                        <div className="flex items-center gap-1">
                          <span className="font-bold">#{uni.ranking}</span>
                        </div>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{uni.programCount || 0}</TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help flex items-center gap-1.5">
                                {getSyncStatusIcon(uni.cricosSyncStatus)}
                                <span className="text-[10px] text-muted-foreground capitalize">
                                  {uni.cricosSyncStatus?.replace('_', ' ') || 'Not Synced'}
                                </span>
                                {uni.lastSyncError && <AlertCircle className="h-3 w-3 text-destructive" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">
                                Last synced: {uni.lastCricosSyncedAt ? format(new Date(uni.lastCricosSyncedAt), 'PPp') : 'Never'}
                              </p>
                              {uni.lastSyncError && (
                                <p className="text-xs text-destructive mt-1 border-t border-destructive/20 pt-1">
                                  Error: {uni.lastSyncError}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          
                          {uni.cricosProviderCode && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleSync(e, uni._id)}
                              disabled={syncingId === uni._id}
                            >
                              <Play className={cn("h-3 w-3", syncingId === uni._id ? "animate-spin" : "")} />
                            </Button>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant={uni.status === 'active' ? 'default' : 'outline'} className="text-[10px] capitalize">
                        {uni.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/universities/${uni.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/universities/${uni._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { setDeleteId(uni._id); setDeleteName(uni.name); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {universities.length} of {meta.total} universities
          </p>
          <div className="flex items-center gap-4">
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[70px] h-8 text-xs">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
            <Pagination
              page={page}
              totalPages={meta.pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title={`Delete "${deleteName}"?`}
        description="This will permanently delete the university and cannot be undone."
      />
    </div>
  );
}
