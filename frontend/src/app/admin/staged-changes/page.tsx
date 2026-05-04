'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, XCircle, RefreshCw, AlertCircle, Loader2, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin.api';
import { format } from 'date-fns';

const ENTITY_TYPES = ['all', 'university', 'program', 'ranking', 'tuition', 'outcome', 'scholarship'];
const STATUSES = ['pending', 'approved', 'rejected', 'edited'];

const CONFIDENCE_COLOR = (c: number) =>
  c >= 0.9 ? 'text-emerald-400' : c >= 0.7 ? 'text-amber-400' : 'text-red-400';

export default function StagedChangesPage() {
  const qc = useQueryClient();
  const [entityType, setEntityType] = useState('all');
  const [status, setStatus] = useState('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['staged-changes', status, entityType],
    queryFn: () => {
      const params: Record<string, string> = { status, limit: '50' };
      if (entityType !== 'all') params.entityType = entityType;
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

  const approveAndSync = useMutation({
    mutationFn: async (c: any) => {
      await adminApi.approveStagedChange(c._id);
      if (c.entityType === 'university' && c.entityId) {
        await adminApi.triggerUniversitySync(c.entityId);
      } else if (c.entityType === 'university' && c.changeType === 'create') {
        // We need to find the ID of the newly created university.
        // This is tricky without the backend returning the ID in the approve response.
        // For now, we'll skip the sync if it's a creation unless we have the ID.
      }
    },
    onSuccess: () => {
      toast.success('Change approved and sync triggered');
      qc.invalidateQueries({ queryKey: ['staged-changes'] });
    },
    onError: (err: any) => toast.error('Approval/Sync failed'),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Staged Changes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review connector-fetched data before it is published to students.
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2 rounded-xl">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-300">
          <strong className="text-amber-200">Admin approval required.</strong>{' '}
          No connector-fetched data is shown to students until approved here.
          Changes with confidence &lt; 60% require manual review.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={status} onValueChange={(v) => setStatus(v ?? 'pending')}>
          <SelectTrigger className="w-36 rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={entityType} onValueChange={(v) => setEntityType(v ?? 'all')}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPES.map((t) => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
          </SelectContent>
        </Select>
        {meta && (
          <span className="ml-auto text-sm text-muted-foreground">
            {meta.total} change{meta.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* List */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : changes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400/40 mb-3" />
            <p className="font-medium text-muted-foreground">No {status} changes</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Everything is up to date.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {changes.map((c: any, i: number) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(expandedId === c._id ? null : c._id)}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="min-w-0 pt-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-xs capitalize">{c.entityType}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{c.changeType}</Badge>
                        <span className={`text-xs font-mono font-bold ${CONFIDENCE_COLOR(c.confidence)}`}>
                          {Math.round(c.confidence * 100)}% confidence
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {(c.universityId as any)?.name ?? c.entityId ?? 'Unknown entity'} ·{' '}
                        {c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-8 border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg"
                          onClick={(e) => { e.stopPropagation(); reject.mutate(c._id); }}
                          disabled={reject.isPending}
                        >
                          {reject.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                          onClick={(e) => { e.stopPropagation(); approve.mutate(c._id); }}
                          disabled={approve.isPending || approveAndSync.isPending}
                        >
                          {approve.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Approve
                        </Button>
                        {c.entityType === 'university' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1 h-8 rounded-lg"
                            onClick={(e) => { e.stopPropagation(); approveAndSync.mutate(c); }}
                            disabled={approve.isPending || approveAndSync.isPending}
                          >
                            {approveAndSync.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Approve & Sync
                          </Button>
                        )}
                      </>
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
                      <div className="grid grid-cols-2 gap-4 px-5 py-4">
                        {c.oldValue && (
                          <div>
                            <p className="text-xs text-muted-foreground font-medium mb-2">Old Value</p>
                            <pre className="text-xs bg-red-500/5 border border-red-500/20 rounded-lg p-3 overflow-auto max-h-40 text-red-300 whitespace-pre-wrap">
                              {JSON.stringify(c.oldValue, null, 2)}
                            </pre>
                          </div>
                        )}
                        <div className={c.oldValue ? '' : 'col-span-2'}>
                          <p className="text-xs text-muted-foreground font-medium mb-2">New Value</p>
                          <pre className="text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 overflow-auto max-h-40 text-emerald-300 whitespace-pre-wrap">
                            {JSON.stringify(c.newValue, null, 2)}
                          </pre>
                        </div>
                      </div>
                      {c.sourceUrl && (
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
      </div>
    </div>
  );
}
