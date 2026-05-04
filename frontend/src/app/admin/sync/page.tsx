'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { RefreshCw, PlayCircle, Loader2, Database, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin.api';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; icon: any; badgeCls: string; iconCls: string }> = {
  pending:    { label: 'Pending',    icon: RefreshCw,    badgeCls: 'border-amber-500/30 text-amber-400 bg-amber-500/5',   iconCls: 'text-amber-400 animate-spin' },
  running:    { label: 'Running',    icon: RefreshCw,    badgeCls: 'border-primary-500/30 text-primary-400 bg-primary-500/5',     iconCls: 'text-primary-400 animate-spin' },
  completed:  { label: 'Completed',  icon: CheckCircle2, badgeCls: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5', iconCls: 'text-emerald-400' },
  failed:     { label: 'Failed',     icon: XCircle,      badgeCls: 'border-red-500/30 text-red-400 bg-red-500/5',       iconCls: 'text-red-400' },
};

export default function SyncJobsPage() {
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sync-jobs'],
    queryFn: () => adminApi.listSyncJobs().then((r) => r.data),
    refetchInterval: 5000, // Poll every 5s to see job progress
  });

  const jobs = data?.data ?? [];

  const syncAll = useMutation({
    mutationFn: () => adminApi.triggerAllUniversitySync(),
    onSuccess: () => {
      toast.success('Queued sync jobs for all universities');
      refetch();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to trigger sync'),
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Data Sync Connectors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger background jobs to fetch dynamic data from university websites and APIs.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} className="gap-2 rounded-xl">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button 
            onClick={() => syncAll.mutate()} 
            disabled={syncAll.isPending}
            className="gap-2 rounded-xl bg-primary-600 hover:bg-primary-700"
          >
            {syncAll.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Sync All Universities
          </Button>
        </div>
      </div>

      {/* Info callout */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-primary-300">
          <strong className="text-primary-200">How it works:</strong> Sync jobs run in the background using BullMQ and Redis.
          They use connectors to scrape or fetch data. Any extracted data is saved as a <strong className="text-primary-200">Staged Change</strong> for your approval.
        </div>
      </div>

      {/* Jobs list */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Sync Jobs</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Database className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">No sync jobs run yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Click "Sync All Universities" to run the first extraction.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {jobs.map((job: any, i: number) => {
              const cfg = statusConfig[job.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={job._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <p className="font-medium truncate text-sm">
                           {job.jobType === 'crawl_university' ? 'University Sync' : job.jobType} - {(job.targetUniversityId as any)?.name || job.targetUniversityId}
                         </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.status === 'completed' && (
                          <span className="text-emerald-400 mr-2">{job.stats?.recordsChanged || 0} staged changes</span>
                        )}
                        {job.logs && job.logs.length > 0 && (
                          <span className="text-red-400 mr-2 line-clamp-1">{job.logs[0]}</span>
                        )}
                        Started: {job.startedAt ? format(new Date(job.startedAt), 'dd MMM HH:mm:ss') : '—'}
                        {job.finishedAt && ` · Ended: ${format(new Date(job.finishedAt), 'HH:mm:ss')}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge variant="outline" className={`gap-1.5 ${cfg.badgeCls}`}>
                      <StatusIcon className={`h-3 w-3 ${cfg.iconCls}`} />
                      {cfg.label}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
