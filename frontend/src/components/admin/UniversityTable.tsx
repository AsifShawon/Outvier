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
import { Card, CardContent } from '@/components/ui/card';
import { universitiesApi } from '@/lib/api/universities.api';
import { cricosApi } from '@/lib/api/cricos.api';
import { type University as UniversityType } from '@/types/university';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AlertCircle, CheckCircle2, Clock, Play, RefreshCw, XCircle, Loader2, MapPin, Award, Filter, University, BookOpen } from 'lucide-react';
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
    queryFn: () => universitiesApi.adminGetAll({ 
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

      {/* Desktop Table View */}
      <div className="hidden md:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
              <TableHead className="w-[40px] pl-6">
                <Checkbox 
                  checked={universities.length > 0 && selectedIds.size === universities.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[280px]">University</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Provider Info</TableHead>
              <TableHead>Metrics</TableHead>
              <TableHead>Sync Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-4" /></TableCell>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : universities.map((uni) => (
                  <TableRow key={uni._id} className="hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="pl-6">
                      <Checkbox 
                        checked={selectedIds.has(uni._id)}
                        onCheckedChange={() => toggleSelect(uni._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {uni.logoUrl ? (
                          <img src={uni.logoUrl} alt={uni.name} className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-100 p-1" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                            <University className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-sm text-slate-900 truncate group-hover:text-deep-green transition-colors">{uni.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">{uni.shortName || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-700">{uni.state}</span>
                        <span className="text-[10px] text-slate-400">{uni.city || 'Multiple Locations'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[9px] font-mono border-slate-200 text-slate-500 py-0 h-4">
                          {uni.cricosProviderCode || 'NO CRICOS'}
                        </Badge>
                        <span className="text-[10px] text-slate-400 italic capitalize">{uni.providerType?.toLowerCase().replace(/_/g, ' ') || 'University'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="h-3 w-3 text-slate-400" />
                          <span className="text-xs font-bold text-slate-700">{uni.programCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Award className="h-3 w-3 text-amber-500" />
                          <span className="text-xs font-bold text-slate-700">{uni.ranking ? `#${uni.ranking}` : 'Unranked'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-help flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full w-fit">
                                {getSyncStatusIcon(uni.cricosSyncStatus)}
                                <span className="text-[10px] font-bold text-slate-600 capitalize">
                                  {uni.cricosSyncStatus?.replace('_', ' ') || 'Not Synced'}
                                </span>
                                {uni.lastSyncError && <AlertCircle className="h-3 w-3 text-red-500" />}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="bg-slate-900 text-white border-none text-[10px]">
                              <p>Last synced: {uni.lastCricosSyncedAt ? format(new Date(uni.lastCricosSyncedAt), 'PPp') : 'Never'}</p>
                              {uni.lastSyncError && <p className="text-red-300 mt-1">Error: {uni.lastSyncError}</p>}
                            </TooltipContent>
                          </Tooltip>
                          
                          {uni.cricosProviderCode && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                              onClick={(e) => handleSync(e, uni._id)}
                              disabled={syncingId === uni._id}
                            >
                              <RefreshCw className={cn("h-3.5 w-3.5", syncingId === uni._id ? "animate-spin" : "")} />
                            </Button>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={uni.status === 'active' ? 'default' : 'outline'} 
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          uni.status === 'active' ? "bg-green-100 text-green-700 hover:bg-green-200 border-none" : "text-slate-400 border-slate-200"
                        )}
                      >
                        {uni.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/universities/${uni.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-deep-green hover:bg-green-50">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/universities/${uni._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteId(uni._id); setDeleteName(uni.name); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl w-full" />)
        ) : (
          universities.map((uni) => (
            <Card key={uni._id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    {uni.logoUrl ? (
                      <img src={uni.logoUrl} alt={uni.name} className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-100 p-1" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                        <University className="h-5 w-5 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-slate-900 leading-tight">{uni.name}</h3>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{uni.shortName || 'N/A'}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={uni.status === 'active' ? 'default' : 'outline'} 
                    className={cn(
                      "text-[10px] rounded-full",
                      uni.status === 'active' ? "bg-green-100 text-green-700 border-none" : ""
                    )}
                  >
                    {uni.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Location</p>
                    <p className="text-xs font-bold text-slate-700">{uni.state}, {uni.city || 'AU'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Ranking</p>
                    <p className="text-xs font-bold text-slate-700">#{uni.ranking || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Programs</p>
                    <p className="text-xs font-bold text-slate-700">{uni.programCount || 0}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Sync Status</p>
                    <div className="flex items-center gap-1.5">
                      {getSyncStatusIcon(uni.cricosSyncStatus)}
                      <span className="text-[10px] font-bold text-slate-600 capitalize">{uni.cricosSyncStatus || 'Not Synced'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" asChild>
                    <Link href={`/admin/universities/${uni._id}/edit`}>Edit Profile</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" asChild>
                    <Link href={`/universities/${uni.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => { setDeleteId(uni._id); setDeleteName(uni.name); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-xs text-slate-400 font-medium">
            Showing <span className="text-slate-900 font-bold">{universities.length}</span> of <span className="text-slate-900 font-bold">{meta.total}</span> universities
          </p>
          <div className="flex items-center gap-4">
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-9 text-xs rounded-xl border-slate-200">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="10">10 / pg</SelectItem>
                <SelectItem value="20">20 / pg</SelectItem>
                <SelectItem value="50">50 / pg</SelectItem>
                <SelectItem value="100">100 / pg</SelectItem>
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
