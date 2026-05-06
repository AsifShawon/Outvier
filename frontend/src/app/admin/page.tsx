'use client';

import { useQuery } from '@tanstack/react-query';
import { University, BookOpen, MapPin, GitCompare, RefreshCw, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api/admin.api';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getStats,
  });

  const stats = data?.data?.data;

  const statsCards = [
    { title: 'Universities', value: stats?.totalUniversities || 0, icon: University, colorClass: 'bg-blue-100 text-blue-700' },
    { title: 'Programs', value: stats?.totalPrograms || 0, icon: BookOpen, colorClass: 'bg-indigo-100 text-indigo-700' },
    { title: 'Campuses', value: stats?.totalCampuses || 0, icon: MapPin, colorClass: 'bg-emerald-100 text-emerald-700' },
    { 
      title: 'Pending Changes', 
      value: stats?.pendingStagedChanges || 0, 
      icon: GitCompare, 
      colorClass: stats?.pendingStagedChanges > 0 ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-slate-100 text-slate-700' 
    },
  ];

  const cricosSyncText = stats?.lastCricosSync 
    ? `${formatDistanceToNow(new Date(stats.lastCricosSync.startedAt))} ago`
    : 'Never';

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Platform health and operational overview.</p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : statsCards.map((card) => (
              <StatsCard key={card.title} {...card} />
            ))}
      </div>

      {/* Operational Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <RefreshCw className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last CRICOS Sync</p>
              <p className="text-lg font-bold">{isLoading ? '...' : cricosSyncText}</p>
            </div>
          </div>
          {!isLoading && stats?.lastCricosSync && (
            <Badge variant={stats.lastCricosSync.status === 'completed' ? 'default' : 'destructive'} className="uppercase text-[10px]">
              {stats.lastCricosSync.status}
            </Badge>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Failed Sync Runs</p>
              <p className="text-lg font-bold">{isLoading ? '...' : stats?.failedSyncRuns || 0}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase">All Time</Badge>
        </div>
      </div>

      {/* Charts / Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Programs by Level
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.programsByLevel?.map((item: any) => {
                const pct = stats.totalPrograms > 0 ? (item.count / stats.totalPrograms) * 100 : 0;
                return (
                  <div key={item._id}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="capitalize font-medium text-slate-700">{item._id.replace(/_/g, ' ')}</span>
                      <span className="text-muted-foreground font-mono">{item.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
          <h2 className="font-bold mb-6 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Universities by State
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {stats?.universitiesByState?.map((item: any) => (
                <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <Badge variant="secondary" className="bg-white shadow-sm border-slate-200">{item._id}</Badge>
                  <span className="text-sm font-bold text-slate-700">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

