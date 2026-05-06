'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cricosApi } from '@/lib/api/cricos.api';
import { RefreshCw, Search, AlertCircle, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ProviderSyncPage() {
  const [providerCode, setProviderCode] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [lastSyncRunId, setLastSyncRunId] = useState<string | null>(null);

  const handlePreview = async () => {
    const code = providerCode.trim().toUpperCase();
    if (!code) return toast.error('Enter a CRICOS provider code');
    setLoading(true);
    setPreview(null);
    try {
      const res = await cricosApi.previewProvider(code);
      setPreview(res.data.data);
    } catch {
      toast.error('Failed to fetch preview. Check the provider code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    const code = providerCode.trim().toUpperCase();
    setSyncing(true);
    try {
      const res = await cricosApi.syncProvider(code);
      setLastSyncRunId(res.data.data.syncRunId);
      toast.success('Sync started. Check CRICOS Runs for status.');
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleRecheck = async () => {
    const code = providerCode.trim().toUpperCase();
    setRechecking(true);
    try {
      const res = await cricosApi.recheckProvider(code);
      setLastSyncRunId(res.data.data.syncRunId);
      toast.success('Recheck started. Only changes will be staged.');
    } catch {
      toast.error('Recheck failed');
    } finally {
      setRechecking(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-display">CRICOS Provider Sync</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Import official CRICOS data by provider code. Use <strong>Sync</strong> for first import,
          <strong> Recheck</strong> to detect changes since last sync.
        </p>
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex gap-4">
          <Input
            placeholder="CRICOS Provider Code (e.g. 00008C)"
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
            className="font-mono uppercase"
          />
          <Button onClick={handlePreview} disabled={loading} variant="secondary" className="shrink-0">
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <><Search className="h-4 w-4 mr-2" />Preview</>}
          </Button>
        </div>

        {lastSyncRunId && (
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/30 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Sync run started — ID: <span className="font-mono">{lastSyncRunId}</span>
          </div>
        )}
      </Card>

      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="p-6 space-y-6">
            <div>
              <h3 className="font-bold text-lg mb-1">Found Records</h3>
              {!preview.institutionFound && (
                <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
                  <AlertCircle className="h-4 w-4" />
                  No institution found for this code
                </div>
              )}
              <div className="space-y-2">
                <StatRow label="Institutions" value={preview.coursesCount !== undefined ? (preview.institutionFound ? 1 : 0) : preview.counts?.institutions ?? 0} />
                <StatRow label="Courses (total)" value={preview.coursesCount ?? preview.counts?.courses ?? 0} />
                <StatRow label="Active courses" value={preview.activeCoursesCount ?? 0} highlight />
                <StatRow label="Expired courses" value={preview.expiredCoursesCount ?? 0} />
                <StatRow label="Campus locations" value={preview.locationsCount ?? preview.counts?.locations ?? 0} />
                <StatRow label="Course-location mappings" value={preview.courseLocationsCount ?? preview.counts?.courseLocations ?? 0} />
              </div>
            </div>

            {preview.warnings?.length > 0 && (
              <div className="space-y-1">
                {preview.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-600">
                    <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button className="flex-1 gap-2" onClick={handleSync} disabled={syncing || rechecking}>
                {syncing
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                {syncing ? 'Syncing...' : 'Full Sync'}
              </Button>
              <Button variant="outline" className="flex-1 gap-2" onClick={handleRecheck} disabled={syncing || rechecking}>
                {rechecking
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RotateCcw className="h-4 w-4" />}
                {rechecking ? 'Rechecking...' : 'Recheck'}
              </Button>
            </div>
          </Card>

          <Card className="p-6 bg-secondary/20 space-y-4">
            <h3 className="font-bold text-lg">Sample Institution Data</h3>
            {preview.sampleInstitution ?? preview.samples?.institution ? (
              <div className="space-y-2 text-sm">
                {Object.entries(preview.sampleInstitution ?? preview.samples?.institution ?? {})
                  .filter(([k]) => !['_id', '__v', 'raw', 'rawHash'].includes(k))
                  .slice(0, 10)
                  .map(([k, v]: [string, any]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-muted-foreground w-36 shrink-0 text-xs">{k}</span>
                      <span className="font-medium text-xs break-all">{String(v ?? '')}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                <p className="text-sm">No institution data</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={cn('font-bold text-sm', value > 0 ? (highlight ? 'text-green-600' : 'text-primary') : 'text-muted-foreground')}>
        {value.toLocaleString()}
      </span>
    </div>
  );
}
