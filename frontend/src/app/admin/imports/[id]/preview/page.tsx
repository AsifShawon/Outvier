'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import api from '@/lib/api';

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  update: 'bg-primary-500/10 text-primary-600 border-primary-500/20',
  duplicate: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  invalid: 'bg-red-500/10 text-red-600 border-red-500/20',
};

export default function ImportPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['import', id],
    queryFn: () => api.get(`/admin/imports/${id}`),
    enabled: !!id,
  });

  const job = data?.data?.data;

  const confirmMutation = useMutation({
    mutationFn: () => api.post(`/admin/imports/${id}/confirm`),
    onSuccess: () => {
      toast.success('Import confirmed! Staged changes have been created.');
      queryClient.invalidateQueries({ queryKey: ['import', id] });
      router.push('/admin/imports');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to confirm import');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/admin/imports/${id}/cancel`),
    onSuccess: () => {
      toast.success('Import cancelled.');
      queryClient.invalidateQueries({ queryKey: ['import', id] });
      router.push('/admin/imports');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to cancel import');
    },
  });

  const statusBadge = job?.status === 'confirmed' || job?.status === 'completed'
    ? <Badge variant="default" className="gap-1.5"><CheckCircle2 className="h-3 w-3" /> {job.status}</Badge>
    : job?.status === 'failed'
    ? <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" /> Failed</Badge>
    : <Badge variant="secondary" className="gap-1.5"><RefreshCw className="h-3 w-3" /> {job?.status}</Badge>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/imports">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold font-display text-slate-900">Import Details</h1>
            <p className="text-sm text-slate-500">{job?.originalFilename}</p>
          </div>
          {!isLoading && statusBadge}
        </div>
        {!isLoading && job?.status === 'preview' && (
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => cancelMutation.mutate()} 
              disabled={cancelMutation.isPending || confirmMutation.isPending}
              className="rounded-xl border-slate-200"
            >
              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
              Cancel Import
            </Button>
            <Button 
              onClick={() => confirmMutation.mutate()} 
              disabled={confirmMutation.isPending || cancelMutation.isPending}
              className="rounded-xl bg-primary-600 hover:bg-primary-700 text-white"
            >
              {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Confirm Import
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !job ? (
        <div className="text-center py-20 text-slate-500">Import not found</div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Rows', value: job.totalRows },
              { label: 'Valid', value: job.validRows, color: 'text-emerald-600' },
              { label: 'Invalid', value: job.invalidRows, color: 'text-red-600' },
              { label: 'Duplicates', value: job.duplicateRows, color: 'text-amber-600' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className={`text-2xl font-bold font-display ${s.color || 'text-slate-800'}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Row errors */}
          {job.rowErrors && job.rowErrors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-red-100 text-sm font-medium text-red-800 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Row Errors ({job.rowErrors.length})
              </div>
              <div className="divide-y divide-red-100 max-h-60 overflow-y-auto">
                {job.rowErrors.map((e: { row: number; message: string }, i: number) => (
                  <div key={i} className="px-4 py-2.5 text-sm flex gap-3">
                    <span className="text-slate-500 text-xs w-12 flex-shrink-0 pt-0.5 font-medium">Row {e.row}</span>
                    <span className="text-red-700">{e.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview rows */}
          {job.previewRows && job.previewRows.length > 0 && (
             <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-800 flex items-center gap-2 bg-slate-50">
                  Preview Rows ({job.previewRows.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {job.previewRows.map((row: any, i: number) => (
                    <div key={i} className="px-4 py-3 flex gap-4 text-sm items-center hover:bg-slate-50">
                      <div className="w-12 text-xs text-slate-400 font-medium">Row {row.rowIndex}</div>
                      <div className="w-24">
                        <Badge variant="outline" className={`capitalize ${ACTION_COLORS[row.action] || ''}`}>
                          {row.action}
                        </Badge>
                      </div>
                      <div className="flex-1 font-medium text-slate-700">
                        {row.data?.universityName || 'Invalid Row'}
                      </div>
                      {row.errors && row.errors.length > 0 && (
                        <div className="text-xs text-red-500">{row.errors.join(', ')}</div>
                      )}
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
