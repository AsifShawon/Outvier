'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { format } from 'date-fns';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  update: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  duplicate: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  invalid: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function ImportPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['import', id],
    queryFn: () =>
      fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/admin/imports/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      }).then((r) => r.json()),
    enabled: !!id,
  });

  const job = data?.data;

  const statusBadge = job?.status === 'completed'
    ? <Badge variant="default" className="gap-1.5"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>
    : job?.status === 'failed'
    ? <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" /> Failed</Badge>
    : <Badge variant="secondary" className="gap-1.5"><RefreshCw className="h-3 w-3" /> {job?.status}</Badge>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/imports">
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-display">Import Details</h1>
          <p className="text-sm text-muted-foreground">{job?.filename}</p>
        </div>
        {!isLoading && statusBadge}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !job ? (
        <div className="text-center py-20 text-muted-foreground">Import not found</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Rows', value: job.totalRows },
              { label: 'Success', value: job.successCount, color: 'text-emerald-400' },
              { label: 'Errors', value: job.errorCount, color: 'text-red-400' },
              { label: 'Entity', value: job.entity },
              { label: 'Imported', value: job.createdAt ? format(new Date(job.createdAt), 'dd MMM yyyy') : '—' },
              { label: 'Status', value: job.status },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/50 bg-card p-4">
                <div className={`text-xl font-bold font-display ${s.color || ''}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Row errors */}
          {job.rowErrors && job.rowErrors.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-500/20 text-sm font-medium text-red-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Row Errors ({job.rowErrors.length})
              </div>
              <div className="divide-y divide-red-500/10 max-h-60 overflow-y-auto">
                {job.rowErrors.map((e: { row: number; message: string }, i: number) => (
                  <div key={i} className="px-4 py-2.5 text-sm flex gap-3">
                    <span className="text-muted-foreground text-xs w-12 flex-shrink-0 pt-0.5">Row {e.row}</span>
                    <span className="text-red-300">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
