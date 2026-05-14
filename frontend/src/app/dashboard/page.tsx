'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { profileApi } from '@/lib/api/profile.api';
import { budgetPlanApi } from '@/lib/api/budgetPlan.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Settings, 
  Bookmark, 
  CheckCircle2, 
  ChevronRight,
  GraduationCap,
  ClipboardList,
  Clock,
  Plus,
  Rocket
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: userRes } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getMe(),
  });

  const { data: profileRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
  });

  const user = userRes?.data?.data;
  const profile = profileRes?.data?.data;

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
    { label: 'Shortlisted', value: profile?.savedPrograms?.length || 0, icon: Bookmark, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Premium Workspace Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your study abroad roadmap is active and ready.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 bg-white flex-1 md:flex-none h-10">
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button size="sm" asChild className="rounded-xl bg-deep-green hover:bg-deep-green/90 shadow-md flex-1 md:flex-none h-10">
            <Link href="/programs">
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden bg-white/80 backdrop-blur-sm hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center gap-4">
              <div className={`p-3 ${stat.bg} rounded-xl`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 leading-none mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tools & Trackers */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Quick Actions & Shortlist */}
            <div className="space-y-6">
              <Card className="rounded-2xl border-slate-200 shadow-sm flex flex-col h-full">
                <CardHeader className="p-5 border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900">Recent Shortlist</CardTitle>
                      <CardDescription className="text-xs">Saved programs</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" className="text-deep-green font-semibold text-xs h-8 px-3" asChild>
                      <Link href="/dashboard/saved">View All</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                   {profile?.savedPrograms?.length > 0 ? (
                     <div className="divide-y divide-slate-100">
                        {profile.savedPrograms.slice(0, 3).map((prog: any) => (
                          <div key={prog._id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                                 {prog.logoUrl ? (
                                   <img src={prog.logoUrl} alt="" className="w-6 h-6 object-contain" />
                                 ) : (
                                   <GraduationCap className="h-5 w-5 text-slate-400" />
                                 )}
                              </div>
                              <div className="min-w-0 pr-3">
                                <p className="text-sm font-semibold text-slate-900 truncate">{prog.name}</p>
                                <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-wider mt-0.5">{prog.universityName}</p>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 rounded-full hover:bg-slate-200/50" asChild>
                              <Link href={`/programs/${prog.slug}`}>
                                 <ChevronRight className="h-4 w-4 text-slate-400" />
                              </Link>
                            </Button>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-8 text-center flex flex-col items-center justify-center h-full">
                       <Bookmark className="h-8 w-8 text-slate-200 mb-3" />
                       <p className="text-sm text-slate-500 font-medium">No shortlisted programs</p>
                       <Button variant="link" size="sm" asChild className="text-deep-green mt-1 h-auto p-0">
                          <Link href="/programs">Explore Programs</Link>
                       </Button>
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Column: Profile Completion */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="rounded-2xl border-none shadow-xl bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
               <User className="h-32 w-32" />
            </div>
            {/* Soft subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-deep-green/20 to-transparent pointer-events-none" />
            
            <CardContent className="p-6 relative z-10">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <p className="text-[10px] uppercase font-black text-green-400 tracking-widest mb-1.5">Your Profile</p>
                   <CardTitle className="text-2xl font-display font-bold">Strength</CardTitle>
                 </div>
                 <div className="text-4xl font-black text-white/90">{completionPercentage}%</div>
               </div>
               
               <Progress value={completionPercentage} className="h-2 bg-white/10 mb-8 rounded-full overflow-hidden">
                 <div className="h-full bg-green-400 transition-all duration-500 ease-in-out" style={{ width: `${completionPercentage}%` }} />
               </Progress>
               
               <div className="space-y-4">
                 {[
                   { label: 'Academic History', complete: !!profile?.academicBackground },
                   { label: 'English Proficiency', complete: !!profile?.ieltsScore || !!profile?.pteScore },
                   { label: 'Financial Preferences', complete: !!profile?.budgetMaxAud },
                   { label: 'Career Goals', complete: !!profile?.careerGoals?.targetRole },
                 ].map((step, i) => (
                   <div key={i} className="flex items-center gap-3">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${step.complete ? 'bg-green-500 text-slate-900' : 'bg-white/10 text-white/40'}`}>
                         {step.complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[10px] font-bold">{i+1}</span>}
                      </div>
                      <span className={`text-sm font-medium ${step.complete ? 'text-white/90' : 'text-white/50'}`}>{step.label}</span>
                   </div>
                 ))}
               </div>

               <Button className="w-full rounded-xl bg-green-500 hover:bg-green-400 text-slate-900 font-bold border-none mt-8 h-12 shadow-lg shadow-green-500/20 transition-all" asChild>
                 <Link href="/dashboard/profile">Complete My Profile</Link>
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
