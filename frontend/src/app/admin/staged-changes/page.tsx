'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, RefreshCw, AlertCircle, Loader2, ChevronDown, AlertTriangle, LinkIcon, FileJson, Sparkles, Zap,
  Square, CheckSquare, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { format } from 'date-fns';

const ENTITY_TYPES = ['all', 'university', 'campus', 'program', 'programLocation', 'ranking', 'tuition', 'outcome', 'scholarship'];
const STATUSES = ['pending', 'approved', 'rejected', 'edited'];

const CONFIDENCE_COLOR = (c: number) =>
  c >= 0.9 ? 'text-emerald-400' : c >= 0.7 ? 'text-amber-400' : 'text-red-400';

export default function StagedChangesPage() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState('all');
  const [status, setStatus] = useState('pending');
  const [universityId, setUniversityId] = useState('all');
  const [externalKey, setExternalKey] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Selection & Pagination state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch Universities for filtering
  const { data: unisData } = useQuery({
    queryKey: ['admin-universities-list'],
    queryFn: () => universitiesApi.getAll().then(r => r.data),
  });
  const universities = unisData?.data || [];

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['staged-changes', status, entityType, universityId, externalKey, page],
    queryFn: () => {
      const params: Record<string, string> = { 
        status, 
        page: page.toString(),
        limit: limit.toString() 
      };
      if (entityType !== 'all') params.entityType = entityType;
      if (universityId !== 'all') params.universityId = universityId;
      if (externalKey) params.externalKey = externalKey;
      return adminApi.listStagedChanges(params).then((r) => r.data);
    },
  });

  const changes: any[] = data?.data ?? [];
  const meta = data?.meta;

  const approve = useMutation({
    mutationFn: (id: string) => adminApi.approveStagedChange(id),
    onSuccess: () => {
      toast.success('Change approved and published');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Approval failed'),
  });

  const reject = useMutation({
    mutationFn: (id: string) => adminApi.rejectStagedChange(id),
    onSuccess: () => {
      toast.success('Change rejected');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Rejection failed'),
  });

  const bulkApprove = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkApproveStagedChanges(ids),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Changes approved');
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk approval failed'),
  });

  const bulkReject = useMutation({
    mutationFn: (ids: string[]) => adminApi.bulkRejectStagedChanges(ids),
    onSuccess: (res: any) => {
      toast.success(res.data?.message || 'Changes rejected');
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk rejection failed'),
  });

  const approveAndSync = useMutation({
    mutationFn: async (c: any) => {
      await adminApi.approveStagedChange(c._id);
      if (c.entityType === 'university' && c.entityId) {
        await adminApi.triggerUniversitySync(c.entityId);
      }
    },
    onSuccess: () => {
      toast.success('Change approved and sync triggered');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: () => toast.error('Approval/Sync failed'),
  });

  const bulkApproveCricos = useMutation({
    mutationFn: () => adminApi.bulkApproveCricos(),
    onSuccess: (res: any) => {
      toast.success(res.data?.message ?? 'CRICOS changes approved');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Bulk approval failed'),
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === changes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(changes.map(c => c._id)));
    }
  };

  const allSelected = changes.length > 0 && selectedIds.size === changes.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  return (
    <div className="space-y-6 max-w-5xl pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Staged Changes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review connector-fetched data before it is published to students.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-1.5 bg-primary/5 rounded-xl border border-primary/20 mr-2">
              <span className="text-xs font-bold px-2 text-primary">{selectedIds.size} selected</span>
              <Button 
                size="sm" 
                className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700"
                onClick={() => bulkApprove.mutate(Array.from(selectedIds))}
                disabled={bulkApprove.isPending}
              >
                {bulkApprove.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />}
                Approve Selected
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 rounded-lg border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => bulkReject.mutate(Array.from(selectedIds))}
                disabled={bulkReject.isPending}
              >
                {bulkReject.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5 mr-1" />}
                Reject
              </Button>
            </div>
          )}

          {status === 'pending' && selectedIds.size === 0 && (
            <Button
              variant="outline"
              onClick={() => bulkApproveCricos.mutate()}
              disabled={bulkApproveCricos.isPending}
              className="gap-2 rounded-xl border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
            >
              {bulkApproveCricos.isPending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Zap className="h-4 w-4" />}
              Approve All CRICOS
            </Button>
          )}
          <Button variant="outline" onClick={() => refetch()} className="gap-2 rounded-xl h-10">
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-300">
          <strong className="text-amber-200">Admin approval required.</strong>{' '}
          No connector-fetched data is shown to students until approved here.
          Changes with confidence &lt; 60% require manual review.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Filters:</span>
        </div>
        
        <Select value={status} onValueChange={(v) => { setStatus(v ?? 'pending'); setPage(1); }}>
          <SelectTrigger className="w-36 rounded-xl bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={entityType} onValueChange={(v) => { setEntityType(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="w-44 rounded-xl bg-card">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={universityId} onValueChange={(v) => { setUniversityId(v ?? 'all'); setPage(1); }}>
          <SelectTrigger className="w-56 rounded-xl bg-card">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Universities</SelectItem>
            {universities.map((u: any) => (
              <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <input
            type="text"
            placeholder="Provider/Course Code..."
            value={externalKey}
            onChange={(e) => { setExternalKey(e.target.value); setPage(1); }}
            className="h-10 w-48 rounded-xl bg-card border border-input px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {meta && (
          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              {meta.total} total changes
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium px-2">
                Page {page} of {meta.pages || 1}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page >= (meta.pages || 1)}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm">
        {/* Bulk select header */}
        {changes.length > 0 && (
          <div className="bg-muted/30 px-5 py-2.5 border-b border-border/40 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all" 
                checked={allSelected} 
                onCheckedChange={toggleSelectAll}
                className="rounded-md border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label htmlFor="select-all" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
                Select All on Page
              </label>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/5 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-400/40" />
            </div>
            <p className="font-medium text-foreground">No {status} changes found</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {universityId !== 'all' || entityType !== 'all' 
                ? "Try adjusting your filters to see more results." 
                : "Everything is up to date and reviewed."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {changes.map((c: any, i: number) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`group transition-colors ${selectedIds.has(c._id) ? 'bg-primary/5' : 'hover:bg-muted/10'}`}
              >
                <div
                  className="flex items-center px-5 py-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                      <Checkbox 
                        checked={selectedIds.has(c._id)} 
                        onCheckedChange={() => toggleSelect(c._id)}
                        className="rounded-md border-muted-foreground/30"
                      />
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-tight ${
                          c.entityType === 'programLocation' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : ''
                        }`}>{c.entityType}</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">{c.changeType}</Badge>
                        <span className={`text-[11px] font-mono font-bold ${CONFIDENCE_COLOR(c.confidence)}`}>
                          {Math.round(c.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground mt-1 truncate">
                        {(c.universityId as any)?.name ?? c.entityId ?? 'Unknown entity'}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : '—'}</span>
                        {c.ingestionJobId && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider">
                            <Sparkles className="h-3 w-3" /> AI Extracted
                          </span>
                        )}
                        {c.externalKey && (
                          <span className="font-mono text-[10px] text-muted-foreground/60">ID: {c.externalKey}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {status === 'pending' && !selectedIds.has(c._id) && (
                      <div className="hidden group-hover:flex items-center gap-2 mr-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full"
                          onClick={(e) => { e.stopPropagation(); reject.mutate(c._id); }}
                          disabled={reject.isPending}
                          title="Reject"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-full"
                          onClick={(e) => { e.stopPropagation(); approve.mutate(c._id); }}
                          disabled={approve.isPending}
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    
                    {status === 'pending' && (
                      <div className="flex items-center gap-2">
                         <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 hidden md:flex"
                          onClick={(e) => { e.stopPropagation(); approve.mutate(c._id); }}
                          disabled={approve.isPending || approveAndSync.isPending}
                        >
                          Approve
                        </Button>
                        {c.entityType === 'university' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 rounded-lg px-3 hidden lg:flex"
                            onClick={(e) => { e.stopPropagation(); approveAndSync.mutate(c); }}
                            disabled={approve.isPending || approveAndSync.isPending}
                          >
                            Sync
                          </Button>
                        )}
                      </div>
                    )}

                    <ChevronDown
                      className={`h-4 w-4 text-muted-foreground transition-transform ${
                        expandedId === c._id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Expanded diff */}
                <AnimatePresence>
                  {expandedId === c._id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/30"
                    >
                      {/* AI Extraction Warnings */}
                      {c.warnings && c.warnings.length > 0 && (
                        <div className="px-5 py-3 border-b border-border/30 bg-amber-500/5">
                          <h4 className="text-xs font-semibold text-amber-500 flex items-center gap-1.5 mb-2">
                            <AlertTriangle className="h-3.5 w-3.5" /> Extraction Warnings
                          </h4>
                          <ul className="space-y-1.5">
                            {c.warnings.map((w: any, idx: number) => (
                              <li key={idx} className="text-xs text-amber-400/80 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1 shrink-0" />
                                <span><strong className="text-amber-300">{w.field}:</strong> {w.message}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Field-Level Source Evidence */}
                      {c.sourceEvidence && Object.keys(c.sourceEvidence).length > 0 && (
                        <div className="px-5 py-4 border-b border-border/30 bg-card">
                          <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 mb-3">
                            <LinkIcon className="h-3.5 w-3.5" /> Source Evidence
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(c.sourceEvidence).map(([field, ev]: [string, any]) => (
                              <div key={field} className="text-xs border border-border/50 rounded-md p-2.5 bg-muted/20">
                                <div className="flex justify-between items-start mb-1.5">
                                  <span className="font-mono text-muted-foreground">{field}</span>
                                  {ev.confidence !== undefined && (
                                    <span className={`font-mono font-bold ${CONFIDENCE_COLOR(ev.confidence)}`}>
                                      {Math.round(ev.confidence * 100)}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-foreground font-medium truncate mb-2" title={JSON.stringify(ev.value)}>
                                  {typeof ev.value === 'object' ? JSON.stringify(ev.value) : String(ev.value)}
                                </div>
                                {ev.sourceUrl && (
                                  <a href={ev.sourceUrl} target="_blank" rel="noreferrer" className="text-[10px] text-primary/70 hover:text-primary underline truncate block">
                                    {ev.sourceUrl}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Diff/JSON */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-5 py-4 bg-muted/5">
                        {(c.oldValue || c.diff) && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                              <FileJson className="h-3.5 w-3.5" /> {c.diff ? 'Old Value / Diff' : 'Old Value'}
                            </p>
                            <pre className="text-xs bg-red-500/5 border border-red-500/20 rounded-lg p-3 overflow-auto max-h-60 text-red-300 whitespace-pre-wrap font-mono">
                              {JSON.stringify(c.diff || c.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className={c.oldValue || c.diff ? '' : 'col-span-2'}>
                          <p className="text-xs text-muted-foreground font-medium mb-2 flex items-center gap-1">
                            <FileJson className="h-3.5 w-3.5" /> New Value
                          </p>
                          <pre className="text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 overflow-auto max-h-60 text-emerald-300 whitespace-pre-wrap font-mono">
                            {JSON.stringify(c.newValue, null, 2)}
                          </pre>
                        </div>
                      </div>

                      {c.sourceUrl && !c.sourceEvidence && (
                        <div className="px-5 pb-4">
                          <a
                            href={c.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-400 underline underline-offset-2 hover:text-primary-300"
                          >
                            Source: {c.sourceUrl}
                          </a>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Bottom Pagination */}
        {meta && meta.pages > 1 && (
           <div className="px-5 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Showing page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{meta.pages}</span> ({meta.total} results)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 gap-1"
                  disabled={page === 1}
                  onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9 gap-1"
                  disabled={page >= meta.pages}
                  onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
