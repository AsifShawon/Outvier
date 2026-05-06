'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  University, 
  BookOpen, 
  MapPin, 
  GitCompare, 
  RefreshCw, 
  AlertTriangle, 
  TrendingUp,
  Users,
  Award,
  FileText,
  Plus,
  ArrowRight,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Clock,
  ExternalLink
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/lib/api/admin.api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow, format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line
} from 'recharts';
import Link from 'next/link';

const COLORS = ['#90AB8B', '#5A7863', '#3B4953', '#B8C9A3', '#DDE6D1', '#7A9181'];

export default function AdminDashboardPage() {
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: adminApi.getStats,
  });

  const { data: activitiesData, isLoading: isLoadingActivities } = useQuery({
    queryKey: ['dashboard-activities'],
    queryFn: adminApi.getActivities,
  });

  const { data: recentData, isLoading: isLoadingRecent } = useQuery({
    queryKey: ['dashboard-recent'],
    queryFn: adminApi.getRecentAdditions,
  });

  const stats = statsData?.data?.data;
  const activities = activitiesData?.data?.data || [];
  const recent = recentData?.data?.data;

  const statsCards = [
    { title: 'Universities', value: stats?.totalUniversities || 0, icon: University, colorClass: 'bg-green-50 text-green-700 border-green-100' },
    { title: 'Programs', value: stats?.totalPrograms || 0, icon: BookOpen, colorClass: 'bg-slate-50 text-slate-700 border-slate-100' },
    { title: 'Students', value: stats?.totalUsers || 0, icon: Users, colorClass: 'bg-cream-100 text-deep-green border-cream-200' },
    { title: 'Scholarships', value: stats?.totalScholarships || 0, icon: Award, colorClass: 'bg-green-50 text-green-700 border-green-100' },
    { title: 'Applications', value: stats?.totalApplications || 0, icon: FileText, colorClass: 'bg-slate-50 text-slate-700 border-slate-100' },
    { 
      title: 'Pending Changes', 
      value: stats?.pendingStagedChanges || 0, 
      icon: GitCompare, 
      colorClass: stats?.pendingStagedChanges > 0 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-50 text-slate-700 border-slate-100' 
    },
  ];

  const quickActions = [
    { title: 'Add University', icon: Plus, href: '/admin/universities/new', color: 'text-green-600 bg-green-50' },
    { title: 'Review Staged', icon: GitCompare, href: '/admin/staged-changes', color: 'text-amber-600 bg-amber-50' },
    { title: 'Sync CRICOS', icon: RefreshCw, href: '/admin/cricos', color: 'text-blue-600 bg-blue-50' },
    { title: 'Bulk Upload', icon: FileText, href: '/admin/uploads', color: 'text-slate-600 bg-slate-50' },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_SIGNUP': return <Users className="h-4 w-4 text-green-600" />;
      case 'UNIVERSITY_ADDED': return <University className="h-4 w-4 text-blue-600" />;
      case 'PROGRAM_ADDED': return <BookOpen className="h-4 w-4 text-purple-600" />;
      case 'STAGED_CHANGE_APPROVED': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'STAGED_CHANGE_REJECTED': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'SYNC_JOB_COMPLETED': return <RefreshCw className="h-4 w-4 text-green-600" />;
      case 'SYNC_JOB_FAILED': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Admin Overview</h1>
          <p className="text-sm text-slate-500 mt-1">Platform operations, health, and recent growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="bg-white" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm" asChild className="bg-deep-green hover:bg-deep-green/90">
            <Link href="/admin/universities/new">
              <Plus className="h-4 w-4 mr-2" />
              New University
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {isLoadingStats
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))
          : statsCards.map((card) => (
              <Card key={card.title} className={`${card.colorClass} border shadow-none rounded-2xl overflow-hidden`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-white/60 rounded-lg shadow-sm">
                      <card.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium opacity-80">{card.title}</p>
                    <p className="text-2xl font-bold font-display mt-1">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Analytics Area */}
        <div className="lg:col-span-8 space-y-8">
          {/* Growth Chart */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 font-display">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    User Growth
                  </CardTitle>
                  <CardDescription>New student signups over the last 30 days</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[300px] w-full flex items-center justify-center">
                {isLoadingStats ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : stats?.userSignups?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats?.userSignups}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="_id" 
                        fontSize={10} 
                        tickFormatter={(val) => format(new Date(val), 'MMM dd')} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b' }}
                      />
                      <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="count" fill="#5A7863" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center space-y-2">
                    <div className="p-3 bg-slate-50 rounded-full inline-block">
                      <Users className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium">No signups in the last 30 days</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Field Distribution */}
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-deep-green" />
                  Programs by Discipline
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[240px]">
                  {isLoadingStats ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats?.programsByField}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="_id"
                        >
                          {stats?.programsByField?.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
                <div className="mt-2 space-y-1.5">
                  {stats?.programsByField?.slice(0, 4).map((item: any, i: number) => (
                    <div key={item._id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-600 truncate max-w-[120px]">{item._id || 'Unknown'}</span>
                      </div>
                      <span className="font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* University State Dist */}
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-deep-green" />
                  Universities by State
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="h-[240px]">
                  {isLoadingStats ? (
                    <Skeleton className="h-full w-full rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.universitiesByState} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="_id" type="category" axisLine={false} tickLine={false} fontSize={10} width={40} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#5A7863" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="border-b bg-white">
              <CardTitle className="text-lg font-display flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-400" />
                Recent Activity
              </CardTitle>
              <CardDescription>The latest events across the platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {isLoadingActivities ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-4 flex gap-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    </div>
                  ))
                ) : activities.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">No recent activities found.</div>
                ) : (
                  activities.map((activity: any) => (
                    <div key={activity._id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className="mt-1 p-2 bg-white border border-slate-100 rounded-lg shadow-sm shrink-0 h-9 w-9 flex items-center justify-center">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="text-sm font-bold text-slate-900 truncate">{activity.title}</p>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{activity.description}</p>
                        <div className="flex items-center gap-2">
                          {activity.actorName && (
                            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 border-none font-normal">
                              {activity.actorName} ({activity.actorRole || 'System'})
                            </Badge>
                          )}
                          {activity.entityType && (
                            <Badge variant="outline" className="text-[10px] text-deep-green border-deep-green/20 font-normal">
                              {activity.entityType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t text-center">
                <Button variant="ghost" size="sm" className="text-xs font-semibold text-slate-600">
                  View Full Audit Log
                  <ArrowRight className="h-3 w-3 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Analytics Area */}
        <div className="lg:col-span-4 space-y-8">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="hover:border-deep-green/30 hover:shadow-md transition-all cursor-pointer h-full group">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className={`p-3 rounded-xl mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">{action.title}</span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Sync Health Panel */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden bg-deep-green text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-white font-display">
                <RefreshCw className="h-5 w-5 opacity-80" />
                Data Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs opacity-90">Last CRICOS Sync</span>
                  <Badge variant="outline" className="text-[10px] border-white/30 text-white uppercase">
                    {stats?.lastCricosSync?.status || 'Unknown'}
                  </Badge>
                </div>
                <p className="text-lg font-bold">
                  {stats?.lastCricosSync?.startedAt 
                    ? formatDistanceToNow(new Date(stats.lastCricosSync.startedAt), { addSuffix: true })
                    : 'Never run'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] opacity-90 block mb-1">Failed Jobs</span>
                  <p className="text-xl font-bold">{stats?.failedSyncRuns || 0}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <span className="text-[10px] opacity-90 block mb-1">Pending Changes</span>
                  <p className="text-xl font-bold">{stats?.pendingStagedChanges || 0}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Button variant="secondary" className="w-full bg-white text-deep-green hover:bg-cream-50 border-none font-bold" asChild>
                  <Link href="/admin/cricos">
                    Run CRICOS Sync
                    <RefreshCw className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="ghost" className="w-full text-white hover:bg-white/10 hover:text-white" asChild>
                  <Link href="/admin/staged-changes">
                    Review Staged Changes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Additions Tabs */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Plus className="h-4 w-4 text-deep-green" />
                Recent Additions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue="universities" className="w-full">
                <TabsList className="w-full justify-start rounded-none bg-transparent border-b h-10 px-4 gap-4">
                  <TabsTrigger value="universities" className="text-[10px] px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-deep-green data-[state=active]:text-deep-green data-[state=active]:bg-transparent shadow-none font-bold text-slate-500">Unis</TabsTrigger>
                  <TabsTrigger value="programs" className="text-[10px] px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-deep-green data-[state=active]:text-deep-green data-[state=active]:bg-transparent shadow-none font-bold text-slate-500">Programs</TabsTrigger>
                  <TabsTrigger value="users" className="text-[10px] px-0 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-deep-green data-[state=active]:text-deep-green data-[state=active]:bg-transparent shadow-none font-bold text-slate-500">Users</TabsTrigger>
                </TabsList>
                
                <div className="p-4">
                  <TabsContent value="universities" className="m-0 focus-visible:ring-0">
                    <div className="space-y-4">
                      {isLoadingRecent ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                      ) : (
                        recent?.universities?.map((uni: any) => (
                          <div key={uni._id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{uni.name}</p>
                              <p className="text-[10px] text-slate-500">{uni.state}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" asChild>
                              <Link href={`/admin/universities/${uni._id}`}>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="programs" className="m-0 focus-visible:ring-0">
                    <div className="space-y-4">
                      {isLoadingRecent ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                      ) : (
                        recent?.programs?.map((prog: any) => (
                          <div key={prog._id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{prog.name}</p>
                              <p className="text-[10px] text-slate-500 capitalize">{prog.level?.replace(/_/g, ' ')}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="users" className="m-0 focus-visible:ring-0">
                    <div className="space-y-4">
                      {isLoadingRecent ? (
                        Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
                      ) : (
                        recent?.users?.map((user: any) => (
                          <div key={user._id} className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate">{user.username}</p>
                              <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {format(new Date(user.createdAt), 'MMM d')}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
              <div className="p-4 bg-slate-50 border-t text-center">
                <Button variant="ghost" size="sm" className="text-[10px] font-bold text-slate-600 h-6" asChild>
                  <Link href="/admin/universities">View All Items</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

