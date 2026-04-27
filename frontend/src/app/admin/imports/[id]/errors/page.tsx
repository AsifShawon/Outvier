'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { adminApi } from '@/lib/api/admin.api';

export default function ImportErrorsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['import', id],
    queryFn: () => adminApi.getImport(id).then((r) => r.data),
    enabled: !!id,
  });

  const job = data?.data;
  const errors: { row: number; message: string }[] = job?.rowErrors ?? [];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/imports/${id}/preview`}>
          <Button variant="ghost" size="icon" className="rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold font-display">Row Errors</h1>
          <p className="text-sm text-muted-foreground">{job?.filename}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : errors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <XCircle className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">No errors recorded for this import.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
          <div className="px-4 py-3 border-b border-red-500/20 text-sm font-medium text-red-300">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </div>
          <div className="divide-y divide-red-500/10 max-h-[60vh] overflow-y-auto">
            {errors.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex gap-4 px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground text-xs w-14 flex-shrink-0 pt-0.5 font-mono">
                  Row {e.row}
                </span>
                <span className="text-red-300">{e.message}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
