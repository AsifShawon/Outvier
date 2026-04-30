'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { GraduationCap, Users, TrendingUp, DollarSign, MapPin, Layers } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function NativeAnalyticsPage() {
  const { data: statsRes, isLoading } = useQuery({
    queryKey: ['native-stats'],
    queryFn: () => api.get('/admin/analytics/native').then(r => r.data),
  });

  const stats = statsRes?.data;

  if (isLoading) return <div className="p-8">Loading native stats...</div>;

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight">System Performance</h1>
        <p className="text-muted-foreground mt-1">Real-time platform metrics sourced directly from the database.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Programs" 
          value={stats?.programsByLevel.reduce((a: any, b: any) => a + b.count, 0) || 0}
          icon={GraduationCap}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard 
          title="Total Universities" 
          value={stats?.universitiesByState.reduce((a: any, b: any) => a + b.count, 0) || 0}
          icon={MapPin}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <StatCard 
          title="Pending Changes" 
          value={stats?.stagedChangeStats.find((s: any) => s._id === 'pending')?.count || 0}
          icon={Layers}
          color="text-amber-500"
          bg="bg-amber-50"
        />
        <StatCard 
          title="Sync Health" 
          value={`${stats?.syncJobStats.find((s: any) => s._id === 'completed')?.count || 0}/${stats?.syncJobStats.reduce((a: any, b: any) => a + b.count, 0) || 0}`}
          icon={TrendingUp}
          color="text-purple-500"
          bg="bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Programs by Level */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Programs by Degree Level</CardTitle>
            <CardDescription>Distribution of academic offerings.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.programsByLevel}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tuition Distribution */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Tuition Fee Distribution (International)</CardTitle>
            <CardDescription>Number of programs per price bucket.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.tuitionDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="_id" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#64748b' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Universities by State */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Universities by State</CardTitle>
            <CardDescription>Geographic distribution across Australia.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.universitiesByState}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {stats?.universitiesByState.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Comparisons */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Most Compared Programs</CardTitle>
            <CardDescription>Top programs appearing in comparison sessions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.topComparedPrograms.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-border/60 text-xs font-bold text-primary">
                      {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 line-clamp-1">{p.name}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px] font-bold">
                    {p.count} hits
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
  return (
    <Card className="border-border/60 shadow-sm overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
            <p className="text-3xl font-black font-display tracking-tight text-slate-900">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-2xl ${bg} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
