'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cricosApi } from '@/lib/api/cricos.api';
import {
  RefreshCw, RotateCcw, ArrowLeft, CheckCircle2, AlertCircle,
  Clock, Loader2, BookOpen, MapPin, Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function UniversityCricosPage() {
  const { id } = useParams<{ id: string }>();
  const [university, setUniversity] = useState<any>(null);
  const [stagedChanges, setStagedChanges] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [rechecking, setRechecking] = useState(false);
  const [loading, setLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

  useEffect(() => {
    const token = localStorage.getItem('outvier_token') ?? '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    Promise.all([
      fetch(`${apiBase}/admin/universities/${id}`, { headers }).then((r) => r.json()),
      fetch(`${apiBase}/admin/staged-changes?universityId=${id}&status=pending&limit=50`, { headers })
        .then((r) => r.json()).catch(() => ({ data: [] })),
    ]).then(([uniRes, changesRes]) => {
      setUniversity(uniRes.data ?? uniRes);
      setStagedChanges(changesRes.data ?? []);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await cricosApi.syncUniversity(id);
      toast.success('Sync started. Staged changes will appear shortly.');
    } catch {
      toast.error('Sync failed. Make sure this university has a CRICOS Provider Code.');
    } finally {
      setSyncing(false);
    }
  };

  const handleRecheck = async () => {
    if (!university?.cricosProviderCode) return toast.error('No CRICOS Provider Code set');
    setRechecking(true);
    try {
      await cricosApi.recheckProvider(university.cricosProviderCode);
      toast.success('Recheck started. Only changed records will be staged.');
    } catch {
      toast.error('Recheck failed');
    } finally {
      setRechecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-16">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!university) {
    return <div className="p-12 text-center text-muted-foreground">University not found.</div>;
  }

  const hasCricons = !!university.cricosProviderCode;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href={`/admin/universities/${id}/edit`}>
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Edit
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold font-display">{university.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">CRICOS Data Management</p>
      </div>

      {/* CRICOS Identity */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          CRICOS Identity
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <InfoRow label="CRICOS Provider Code">
            {hasCricons
              ? <span className="font-mono font-bold text-primary">{university.cricosProviderCode}</span>
              : <span className="text-muted-foreground italic">Not set — add in Edit page</span>}
          </InfoRow>
          <InfoRow label="Sync Status">
            <SyncStatusBadge status={university.cricosSyncStatus} />
          </InfoRow>
          <InfoRow label="Last CRICOS Sync">
            {university.lastCricosSyncedAt
              ? format(new Date(university.lastCricosSyncedAt), 'MMM d, yyyy HH:mm')
              : <span className="text-muted-foreground">Never</span>}
          </InfoRow>
          <InfoRow label="Institution Type">
            {university.institutionType ?? <span className="text-muted-foreground">—</span>}
          </InfoRow>
          <InfoRow label="Institution Capacity">
            {university.institutionCapacity
              ? university.institutionCapacity.toLocaleString()
              : <span className="text-muted-foreground">—</span>}
          </InfoRow>
        </div>

        <Separator />

        <div className="flex gap-3">
          <Button
            onClick={handleSync}
            disabled={!hasCricons || syncing || rechecking}
            className="gap-2"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {syncing ? 'Syncing...' : 'Full Sync'}
          </Button>
          <Button
            variant="outline"
            onClick={handleRecheck}
            disabled={!hasCricons || syncing || rechecking}
            className="gap-2"
          >
            {rechecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            {rechecking ? 'Rechecking...' : 'Recheck CRICOS'}
          </Button>
          {hasCricons && (
            <Link
              href={`/admin/cricos/provider-sync?code=${university.cricosProviderCode}`}
              className="ml-auto"
            >
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <BookOpen className="h-4 w-4" />
                Preview in Provider Sync
              </Button>
            </Link>
          )}
        </div>

        {!hasCricons && (
          <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Set a CRICOS Provider Code in the Edit page before syncing.
          </div>
        )}
      </Card>

      {/* Pending staged changes */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500" />
          Pending Staged Changes
          {stagedChanges.length > 0 && (
            <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 ml-1">
              {stagedChanges.length}
            </Badge>
          )}
        </h2>

        {stagedChanges.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            No pending staged changes for this university.
          </div>
        ) : (
          <div className="space-y-2">
            {stagedChanges.slice(0, 15).map((change: any) => (
              <div key={change._id} className="flex items-center gap-3 py-2 border-b last:border-0 text-sm">
                <EntityTypeBadge type={change.entityType} />
                <span className="capitalize text-muted-foreground">{change.changeType}</span>
                <span className="flex-1 truncate">
                  {change.newValue?.name ?? change.newValue?.courseName ?? change.externalKey ?? change._id}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(change.createdAt), 'MMM d, HH:mm')}
                </span>
              </div>
            ))}
            {stagedChanges.length > 15 && (
              <p className="text-xs text-muted-foreground pt-1">
                +{stagedChanges.length - 15} more…
              </p>
            )}
            <Link href={`/admin/staged-changes?universityId=${id}&status=pending`}>
              <Button variant="outline" size="sm" className="mt-2">Review All in Staged Changes</Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Raw data quick links */}
      <Card className="p-6 space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          Raw CRICOS Data
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse raw source records for this provider from the last sync.
        </p>
        {hasCricons ? (
          <div className="flex gap-2 flex-wrap">
            <Link href={`/admin/cricos/raw/institutions?providerCode=${university.cricosProviderCode}`}>
              <Button variant="outline" size="sm">Raw Institution</Button>
            </Link>
            <Link href={`/admin/cricos/raw/courses?providerCode=${university.cricosProviderCode}`}>
              <Button variant="outline" size="sm">Raw Courses</Button>
            </Link>
            <Link href={`/admin/cricos/raw/locations?providerCode=${university.cricosProviderCode}`}>
              <Button variant="outline" size="sm">Raw Locations</Button>
            </Link>
            <Link href={`/admin/cricos/raw/course-locations?providerCode=${university.cricosProviderCode}`}>
              <Button variant="outline" size="sm">Raw Course Locations</Button>
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">Set a CRICOS Provider Code first.</p>
        )}
      </Card>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function SyncStatusBadge({ status }: { status?: string }) {
  switch (status) {
    case 'synced': return <Badge className="bg-green-500/10 text-green-600 border-green-200">Synced</Badge>;
    case 'changes_pending': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Changes Pending</Badge>;
    case 'failed': return <Badge variant="destructive">Failed</Badge>;
    default: return <Badge variant="outline">Not Synced</Badge>;
  }
}

function EntityTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    university: 'bg-blue-100 text-blue-700',
    program: 'bg-purple-100 text-purple-700',
    campus: 'bg-green-100 text-green-700',
    programLocation: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type] ?? 'bg-muted text-muted-foreground'}`}>
      {type}
    </span>
  );
}
