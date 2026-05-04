'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Upload, CheckCircle2, XCircle, Clock, AlertCircle, Plus, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api/admin.api';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; icon: React.ElementType; badgeCls: string; iconCls: string }> = {
  pending:    { label: 'Pending',    icon: Clock,        badgeCls: 'border-amber-500/30 text-amber-400',   iconCls: 'text-amber-400' },
  processing: { label: 'Processing', icon: AlertCircle,  badgeCls: 'border-primary-500/30 text-primary-400',     iconCls: 'text-primary-400' },
  completed:  { label: 'Completed',  icon: CheckCircle2, badgeCls: 'border-emerald-500/30 text-emerald-400', iconCls: 'text-emerald-400' },
  failed:     { label: 'Failed',     icon: XCircle,      badgeCls: 'border-red-500/30 text-red-400',       iconCls: 'text-red-400' },
};

export default function AdminImportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-imports'],
    queryFn: () => adminApi.listImports().then((r) => r.data),
  });

  const imports: any[] = data?.data ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Seed Data Imports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a CSV to seed static university identity data. Dynamic data is fetched via scheduled connectors.
          </p>
        </div>
        <Link href="/admin/imports/new">
          <Button className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" />
            New Import
          </Button>
        </Link>
      </div>

      {/* Info callout */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-4 flex gap-3 items-start">
        <AlertCircle className="h-5 w-5 text-primary-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-primary-300">
          <strong className="text-primary-200">Seed upload captures static identity only</strong> — name, location, website, CRICOS code.
          Ranking, tuition, scholarships, and outcomes are fetched automatically via connectors and go through{' '}
          <strong className="text-primary-200">staging → admin approval</strong> before being shown to students.
        </div>
      </div>

      {/* Import list */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border/40">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Import History</h2>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
        ) : imports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <Upload className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium text-muted-foreground">No imports yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Upload your first seed CSV to get started.</p>
            <Link href="/admin/imports/new" className="mt-4">
              <Button variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Upload CSV
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {imports.map((imp: any, i: number) => {
              const cfg = statusConfig[imp.status] ?? statusConfig.pending;
              const StatusIcon = cfg.icon;
              return (
                <motion.div
                  key={imp._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Upload className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-sm">{imp.filename}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {imp.totalRows} rows · {imp.successCount ?? 0} success · {imp.errorCount ?? 0} errors ·{' '}
                        {imp.createdAt ? format(new Date(imp.createdAt), 'dd MMM yyyy HH:mm') : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <Badge variant="outline" className={`gap-1.5 ${cfg.badgeCls}`}>
                      <StatusIcon className={`h-3 w-3 ${cfg.iconCls}`} />
                      {cfg.label}
                    </Badge>
                    <Link href={`/admin/imports/${imp._id}/preview`}>
                      <Button variant="ghost" size="sm" className="gap-1.5 h-8 rounded-lg">
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                    </Link>
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
