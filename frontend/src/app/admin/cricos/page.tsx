'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cricosApi } from '@/lib/api/cricos.api';
import {
  RefreshCw, Database, FileText, Search, Building2,
  BookOpen, MapPin, Network, AlertCircle, CheckCircle2,
  Clock, Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface CricosStats {
  totalInstitutions: number;
  totalCourses: number;
  totalLocations: number;
  totalCourseLocations: number;
  pendingChanges: number;
  failedRuns: number;
  lastSync: { status: string; startedAt: string; providerCode?: string } | null;
}

export default function CricosDashboard() {
  const [stats, setStats] = useState<CricosStats | null>(null);
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([cricosApi.getStats(), cricosApi.getResources()])
      .then(([statsRes, resourcesRes]) => {
        setStats(statsRes.data.data);
        setResources(resourcesRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">CRICOS Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Official Australian CRICOS data from data.gov.au
          </p>
        </div>
        <Link href="/admin/cricos/provider-sync">
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync / Recheck Provider
          </Button>
        </Link>
      </div>

      {/* Live stats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-8 bg-muted rounded mb-2 w-16" />
              <div className="h-4 bg-muted rounded w-24" />
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Building2} label="Raw Institutions" value={stats.totalInstitutions} href="/admin/cricos/raw/institutions" color="blue" />
          <StatCard icon={BookOpen} label="Raw Courses" value={stats.totalCourses} href="/admin/cricos/raw/courses" color="purple" />
          <StatCard icon={MapPin} label="Raw Locations" value={stats.totalLocations} href="/admin/cricos/raw/locations" color="green" />
          <StatCard icon={Network} label="Course Locations" value={stats.totalCourseLocations} href="/admin/cricos/raw/course-locations" color="orange" />
        </div>
      ) : null}

      {/* Status row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${stats.pendingChanges > 0 ? 'bg-amber-100 dark:bg-amber-950' : 'bg-green-100 dark:bg-green-950'}`}>
              {stats.pendingChanges > 0
                ? <AlertCircle className="h-5 w-5 text-amber-600" />
                : <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pendingChanges}</div>
              <div className="text-xs text-muted-foreground">Pending CRICOS staged changes</div>
            </div>
            {stats.pendingChanges > 0 && (
              <Link href="/admin/staged-changes?entityType=program" className="ml-auto">
                <Button size="sm" variant="outline">Review</Button>
              </Link>
            )}
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-semibold">
                {stats.lastSync
                  ? format(new Date(stats.lastSync.startedAt), 'MMM d, HH:mm')
                  : 'Never synced'}
              </div>
              <div className="text-xs text-muted-foreground">
                {stats.lastSync
                  ? `Last sync${stats.lastSync.providerCode ? ` — ${stats.lastSync.providerCode}` : ''}`
                  : 'No sync runs yet'}
              </div>
            </div>
            {stats.lastSync && (
              <StatusBadge status={stats.lastSync.status} className="ml-auto" />
            )}
          </Card>

          <Card className="p-5 flex items-center gap-4">
            <div className={`p-2 rounded-lg ${stats.failedRuns > 0 ? 'bg-red-100 dark:bg-red-950' : 'bg-green-100 dark:bg-green-950'}`}>
              {stats.failedRuns > 0
                ? <AlertCircle className="h-5 w-5 text-red-500" />
                : <CheckCircle2 className="h-5 w-5 text-green-600" />}
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.failedRuns}</div>
              <div className="text-xs text-muted-foreground">Failed sync runs (all time)</div>
            </div>
            <Link href="/admin/cricos/runs" className="ml-auto">
              <Button size="sm" variant="outline">View Runs</Button>
            </Link>
          </Card>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Sync Runs
          </h2>
          <p className="text-sm text-muted-foreground">
            Monitor and review all CRICOS sync and recheck operations.
          </p>
          <Link href="/admin/cricos/runs">
            <Button variant="outline">View All Runs</Button>
          </Link>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Inspect Resource Fields
          </h2>
          <p className="text-sm text-muted-foreground">
            Explore available fields and sample rows from each CRICOS resource.
          </p>
          <div className="flex flex-wrap gap-2">
            {resources && Object.entries(resources).map(([key, res]: [string, any]) => (
              <Link key={key} href={`/admin/cricos/inspect?resourceId=${res.id}`}>
                <Button variant="outline" size="sm">{res.name}</Button>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Raw Data Explorer
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse raw CRICOS source records stored from last sync.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/cricos/raw/institutions"><Button variant="outline" size="sm">Institutions</Button></Link>
            <Link href="/admin/cricos/raw/courses"><Button variant="outline" size="sm">Courses</Button></Link>
            <Link href="/admin/cricos/raw/locations"><Button variant="outline" size="sm">Locations</Button></Link>
            <Link href="/admin/cricos/raw/course-locations"><Button variant="outline" size="sm">Course Locations</Button></Link>
          </div>
        </Card>

        <Card className="p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Data Resources
          </h2>
          <p className="text-sm text-muted-foreground">
            Four CRICOS resources from data.gov.au CKAN DataStore API.
          </p>
          {resources && (
            <div className="space-y-1">
              {Object.entries(resources).map(([key, res]: [string, any]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className="font-medium w-36 shrink-0">{res.name}</span>
                  <span className="font-mono text-muted-foreground text-[10px]">{res.id}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, href, color,
}: {
  icon: any; label: string; value: number; href: string; color: string;
}) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-100 dark:bg-blue-950 text-blue-600',
    purple: 'bg-purple-100 dark:bg-purple-950 text-purple-600',
    green: 'bg-green-100 dark:bg-green-950 text-green-600',
    orange: 'bg-orange-100 dark:bg-orange-950 text-orange-600',
  };
  return (
    <Link href={href}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold group-hover:text-primary transition-colors">
          {value.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{label}</div>
      </Card>
    </Link>
  );
}

function StatusBadge({ status, className }: { status: string; className?: string }) {
  if (status === 'completed') return <Badge className={`bg-green-500/10 text-green-600 border-green-200 ${className}`}>Completed</Badge>;
  if (status === 'failed') return <Badge variant="destructive" className={className}>Failed</Badge>;
  if (status === 'running') return <Badge variant="secondary" className={`animate-pulse ${className}`}>Running</Badge>;
  return <Badge variant="outline" className={className}>{status}</Badge>;
}
