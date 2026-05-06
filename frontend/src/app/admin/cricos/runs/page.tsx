'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cricosApi } from '@/lib/api/cricos.api';
import { format } from 'date-fns';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

export default function SyncRunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cricosApi.getSyncRuns().then(res => {
      setRuns(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display">CRICOS Sync Runs</h1>
      
      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="p-4 font-semibold text-sm">Provider</th>
              <th className="p-4 font-semibold text-sm">Status</th>
              <th className="p-4 font-semibold text-sm">Stats</th>
              <th className="p-4 font-semibold text-sm">Started At</th>
              <th className="p-4 font-semibold text-sm">Duration</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                </td>
              </tr>
            ) : runs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No sync runs found
                </td>
              </tr>
            ) : runs.map((run) => (
              <tr key={run._id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="font-medium uppercase">{run.providerCode || 'All'}</div>
                  <div className="text-xs text-muted-foreground">{run.syncType}</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={run.status} />
                </td>
                <td className="p-4">
                  <div className="text-xs space-y-1">
                    <p>Institutions: {run.stats.institutionsFetched}</p>
                    <p>Courses: {run.stats.coursesFetched}</p>
                    <p>Staged: {run.stats.stagedChangesCreated}</p>
                  </div>
                </td>
                <td className="p-4 text-sm">
                  {format(new Date(run.startedAt), 'MMM d, HH:mm')}
                </td>
                <td className="p-4 text-sm text-muted-foreground">
                  {run.finishedAt ? `${Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000)}s` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-600 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" /> Completed</Badge>;
    case 'failed':
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Failed</Badge>;
    case 'running':
      return <Badge variant="secondary" className="gap-1 animate-pulse"><Clock className="h-3 w-3" /> Running</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}
