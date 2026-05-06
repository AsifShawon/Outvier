'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { profileApi } from '@/lib/api/profile.api';
import { comparisonApi } from '@/lib/api/comparison.api';
import { applicationTrackerApi } from '@/lib/api/applicationTracker.api';
import { budgetPlanApi } from '@/lib/api/budgetPlan.api';
import { useComparison } from '@/context/ComparisonContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Bookmark, 
  LineChart, 
  Calendar, 
  CheckCircle2, 
  Circle,
  ChevronRight,
  TrendingUp,
  MapPin,
  GraduationCap,
  ClipboardList,
  Wallet,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
  Plus,
  Rocket
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { hash } = useComparison();

  const { data: userRes } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  const { data: profileRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const { data: trackerRes } = useQuery({
    queryKey: ['application-tracker'],
    queryFn: () => applicationTrackerApi.getAll(),
  });

  const { data: budgetRes } = useQuery({
    queryKey: ['budget-plans'],
    queryFn: () => budgetPlanApi.getAll(),
  });

  const user = userRes?.data?.data;
  const profile = profileRes?.data?.data;
  const applications = trackerRes?.data?.data || [];
  const budgetPlans = budgetRes?.data?.data || [];
  const activeBudget = budgetPlans[0]; // Just take the latest for summary

  // Calculate profile completion
  const completionFields = [
    !!profile?.preferredField,
    !!profile?.preferredLevel,
    !!profile?.budgetMaxAud,
    (profile?.preferredStates?.length || 0) > 0,
    !!profile?.ieltsScore || !!profile?.pteScore,
    !!profile?.academicBackground,
    !!profile?.careerGoals?.targetRole,
  ];
  const completionPercentage = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  const stats = [
    { label: 'Applications', value: applications.length, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Shortlisted', value: profile?.savedPrograms?.length || 0, icon: Bookmark, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Tasks Pending', value: applications.reduce((acc, app) => acc + (app.tasks?.filter(t => !t.completed).length || 0), 0), icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Premium Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900">
            Planning Workspace
          </h1>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            Welcome back, <span className="font-bold text-slate-900">{user?.name || 'Student'}</span>. Your study abroad roadmap is active.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 bg-white">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button size="sm" asChild className="rounded-xl bg-deep-green hover:bg-deep-green/90 shadow-md">
            <Link href="/programs">
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-100 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-3 ${stat.bg} rounded-xl`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                </div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-300" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Tools & Trackers */}
        <div className="lg:col-span-8 space-y-8">
          {/* Main Planning Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Application Tracker Preview */}
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Rocket className="h-5 w-5 text-blue-600" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-blue-100 text-blue-600">
                    Active Pipeline
                  </Badge>
                </div>
                <CardTitle className="text-xl font-display mt-4">Application Tracker</CardTitle>
                <CardDescription>Track status and document checklists.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.slice(0, 2).map((app) => (
                      <div key={app._id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{app.programName}</p>
                          <p className="text-[10px] text-slate-500 truncate">{app.universityName}</p>
                        </div>
                        <Badge className="text-[10px] capitalize bg-white text-slate-700 border-slate-200 hover:bg-white">
                          {app.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium px-4">No active applications. Move a saved program to start tracking.</p>
                  </div>
                )}
              </CardContent>
              <div className="p-4 bg-slate-50 border-t">
                <Button className="w-full rounded-xl bg-white text-slate-900 border-slate-200 hover:bg-slate-100" asChild>
                  <Link href="/dashboard/tracker">
                    Open Kanban Board
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>

            {/* Budget Plan Preview */}
            <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-center">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Wallet className="h-5 w-5 text-green-600" />
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-green-100 text-green-600">
                    Financial Health
                  </Badge>
                </div>
                <CardTitle className="text-xl font-display mt-4">Budget Calculator</CardTitle>
                <CardDescription>Manage tuition and living expenses.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {activeBudget ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-xl">
                      <div>
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Total Est. Cost</p>
                        <p className="text-xl font-black">${((activeBudget.tuitionFeesAud || 0) + (activeBudget.livingExpensesAud || 0)).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold opacity-60 tracking-wider">Net Gap</p>
                        <p className="text-lg font-bold text-green-400">-${(activeBudget.scholarshipAud || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                        <span>Funding Covered</span>
                        <span>{Math.min(100, Math.round(((activeBudget.savingsAud || 0) / ((activeBudget.tuitionFeesAud || 1) + (activeBudget.livingExpensesAud || 0))) * 100))}%</span>
                      </div>
                      <Progress value={Math.min(100, Math.round(((activeBudget.savingsAud || 0) / ((activeBudget.tuitionFeesAud || 1) + (activeBudget.livingExpensesAud || 0))) * 100))} className="h-1.5" />
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-medium px-4">Setup your first budget plan to see a financial summary.</p>
                  </div>
                )}
              </CardContent>
              <div className="p-4 bg-slate-50 border-t">
                <Button className="w-full rounded-xl bg-white text-slate-900 border-slate-200 hover:bg-slate-100" asChild>
                  <Link href="/dashboard/budget">
                    Open Calculator
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Fit Score & Shortlist Section */}
          <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-display">My Shortlisted Programs</CardTitle>
                  <CardDescription>Quick view of your saved programs.</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-deep-green font-bold text-xs" asChild>
                  <Link href="/dashboard/saved">View All Saved</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {profile?.savedPrograms?.length > 0 ? (
                 <div className="divide-y divide-slate-100">
                    {profile.savedPrograms.slice(0, 4).map((prog: any) => (
                      <div key={prog._id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                             {prog.logoUrl ? (
                               <img src={prog.logoUrl} alt="" className="w-6 h-6 object-contain" />
                             ) : (
                               <GraduationCap className="h-5 w-5 text-slate-400" />
                             )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{prog.name}</p>
                            <p className="text-[10px] text-slate-500 truncate uppercase font-medium">{prog.universityName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           {/* Fit Score hidden for now */}
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] text-slate-400 uppercase font-bold">Status</p>
                              <p className="text-sm font-bold text-slate-600">Saved</p>
                           </div>
                           <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white border border-transparent hover:border-slate-100" asChild>
                             <Link href={`/programs/${prog.slug}`}>
                                <ChevronRight className="h-4 w-4" />
                             </Link>
                           </Button>
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="p-12 text-center">
                   <Bookmark className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-sm text-slate-500 mb-4">You haven't shortlisted any programs yet.</p>
                   <Button asChild className="bg-deep-green rounded-xl">
                      <Link href="/programs">Start Exploring Programs</Link>
                   </Button>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profile & Checklist */}
        <div className="lg:col-span-4 space-y-8">
          {/* Profile Completion Stepper-like Widget */}
          <Card className="rounded-3xl border-none shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <User className="h-32 w-32" />
            </div>
            <CardHeader className="relative z-10">
               <p className="text-[10px] uppercase font-black text-green-400 tracking-widest mb-2">Academic Profile</p>
               <CardTitle className="text-2xl font-display">Profile Strength</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10 pt-0">
              <div className="flex items-center gap-4">
                <div className="text-4xl font-black text-white">{completionPercentage}%</div>
                <div className="flex-1">
                   <Progress value={completionPercentage} className="h-2 bg-white/10" />
                </div>
              </div>
              
              <div className="space-y-3 pt-2">
                 {[
                   { label: 'Academic History', complete: !!profile?.academicBackground },
                   { label: 'English Proficiency', complete: !!profile?.ieltsScore || !!profile?.pteScore },
                   { label: 'Financial Preferences', complete: !!profile?.budgetMaxAud },
                   { label: 'Career Goals', complete: !!profile?.careerGoals?.targetRole },
                 ].map((step, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${step.complete ? 'bg-green-500' : 'bg-white/10'}`}>
                         {step.complete ? <CheckCircle2 className="h-3 w-3 text-white" /> : <span className="text-[10px] font-bold text-white/40">{i+1}</span>}
                      </div>
                      <span className={`text-xs font-bold ${step.complete ? 'text-white/90' : 'text-white/40'}`}>{step.label}</span>
                   </div>
                 ))}
              </div>

              <Button className="w-full rounded-2xl bg-green-500 hover:bg-green-600 text-slate-900 font-black border-none mt-4 shadow-lg shadow-green-500/20" asChild>
                <Link href="/dashboard/profile">
                  Complete My Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions / Shortcuts */}
          <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest ml-1">Quick Tools</h3>
             <div className="grid grid-cols-1 gap-3">
                 {/* Fit Score tool hidden */}
                <Link href="/dashboard/saved" className="group">
                   <div className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-deep-green hover:shadow-md transition-all flex items-center gap-4">
                      <div className="p-2 bg-cream-100 rounded-xl group-hover:bg-deep-green group-hover:text-white transition-colors">
                         <Bookmark className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs font-bold text-slate-900">My Shortlist</p>
                         <p className="text-[10px] text-slate-500">Manage saved programs</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                   </div>
                </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
