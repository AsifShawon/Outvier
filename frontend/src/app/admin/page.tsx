'use client';

import { useQuery } from '@tanstack/react-query';
import { University, BookOpen, Users, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api/admin.api';
import { DashboardStats } from '@/types/api';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getStats,
  });

  const stats: DashboardStats | undefined = data?.data?.data;

  const statsCards = [
    { title: 'Universities', value: stats?.totalUniversities || 0, icon: University, colorClass: 'bg-blue-100 text-blue-700' },
    { title: 'Programs', value: stats?.totalPrograms || 0, icon: BookOpen, colorClass: 'bg-violet-100 text-violet-700' },
    { title: 'Admin Users', value: stats?.totalUsers || 0, icon: Users, colorClass: 'bg-emerald-100 text-emerald-700' },
    { title: 'Study Levels', value: stats?.programsByLevel?.length || 0, icon: TrendingUp, colorClass: 'bg-amber-100 text-amber-700' },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here&#39;s an overview of Outvier&apos;s content.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))
          : statsCards.map((card) => (
              <StatsCard key={card.title} {...card} />
            ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Programs by level */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold mb-4">Programs by Level</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.programsByLevel?.map((item) => {
                const pct = stats.totalPrograms > 0 ? (item.count / stats.totalPrograms) * 100 : 0;
                return (
                  <div key={item._id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{item._id.replace('_', ' ')}</span>
                      <span className="text-muted-foreground">{item.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Universities by state */}
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="font-semibold mb-4">Universities by State</h2>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {stats?.universitiesByState?.map((item) => (
                <div key={item._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <Badge variant="secondary">{item._id}</Badge>
                  <span className="text-sm font-medium">{item.count} universities</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
