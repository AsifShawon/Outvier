'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth.api';
import { profileApi } from '@/lib/api/profile.api';
import { comparisonApi } from '@/lib/api/comparison.api';
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
  GraduationCap
} from 'lucide-react';
import Link from 'next/link';

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

  const { data: scoresRes } = useQuery({
    queryKey: ['fit-scores', hash],
    queryFn: () => comparisonApi.getScores(hash!),
    enabled: !!hash,
  });

  const user = userRes?.data?.data;
  const profile = profileRes?.data?.data;
  const topScores = (scoresRes?.data?.data || []).slice(0, 3);
  const savedProgramsCount = profile?.savedPrograms?.length || 0;

  // Calculate profile completion
  const completionFields = [
    !!profile?.preferredField,
    !!profile?.preferredLevel,
    !!profile?.budgetMaxAud,
    (profile?.preferredStates?.length || 0) > 0,
    !!profile?.ieltsScore || !!profile?.pteScore,
    !!profile?.academicBackground,
  ];
  const completionPercentage = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  const checklist = [
    { label: 'Field of Study', set: !!profile?.preferredField },
    { label: 'Budget', set: !!profile?.budgetMaxAud },
    { label: 'Preferred State', set: (profile?.preferredStates?.length || 0) > 0 },
    { label: 'English Score', set: !!profile?.ieltsScore || !!profile?.pteScore },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Card */}
      <Card className="border-none bg-gradient-to-br from-primary/10 via-primary/5 to-background shadow-sm">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
                G'day, {user?.name || 'Student'}! 👋
              </h1>
              <p className="text-muted-foreground max-w-md">
                Your journey to studying in Australia is well underway. Complete your profile to unlock deeper insights.
              </p>
              <div className="flex flex-wrap gap-2 pt-2 justify-center md:justify-start">
                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-primary/10">
                  {savedProgramsCount} Shortlisted
                </Badge>
                <Badge variant="secondary" className="bg-white/80 backdrop-blur-sm border-primary/10">
                  Australia / International
                </Badge>
              </div>
            </div>
            
            <div className="w-full md:w-64 space-y-3 bg-white/50 backdrop-blur-sm p-5 rounded-2xl border border-white/50">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Profile Completion</span>
                <span className="text-primary">{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
              <Link href="/dashboard/profile">
                <Button variant="link" size="sm" className="px-0 h-auto text-xs font-medium">
                  Finish setting up your profile &rarr;
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Fit Score Widget */}
        <Card className="lg:col-span-2 border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <div>
              <CardTitle className="text-xl font-display font-bold">Your Fit Score</CardTitle>
              <CardDescription>Based on your profile and budget constraints.</CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-primary opacity-50" />
          </CardHeader>
          <CardContent>
            {topScores.length > 0 ? (
              <div className="space-y-6">
                {topScores.map((score: any, idx: number) => (
                  <div key={score.programId} className="group relative">
                    <div className="flex justify-between items-end mb-2">
                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {score.programName || `Program ${idx + 1}`}
                        </div>
                        <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                          University Match
                        </div>
                      </div>
                      <div className="text-xl font-display font-black text-primary">
                        {score.totalScore}%
                      </div>
                    </div>
                    <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000 ease-out rounded-full" 
                        style={{ width: `${score.totalScore}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="pt-4">
                  <Link href="/dashboard/student-fit">
                    <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary group">
                      Detailed Breakdown
                      <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <LineChart className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">No fit scores yet</p>
                  <p className="text-xs text-muted-foreground px-10">Add programs to your shortlist to see how well they match your profile.</p>
                </div>
                <Link href="/programs">
                  <Button size="sm" variant="secondary">Browse Programs</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Checklist */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Next Steps</CardTitle>
            <CardDescription>Improve your match accuracy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {checklist.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-transparent hover:border-border/40 transition-colors">
                {item.set ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className={`text-sm font-medium ${item.set ? 'text-muted-foreground' : 'text-foreground'}`}>
                  {item.label}
                </span>
              </div>
            ))}
            <div className="pt-2">
              <Link href="/dashboard/profile">
                <Button className="w-full">Edit Profile</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recently Saved Programs */}
        <Card className="border-border/60 shadow-sm md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold">Your Shortlist</CardTitle>
              <CardDescription>Recently bookmarked programs.</CardDescription>
            </div>
            <Link href="/dashboard/saved">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {profile?.savedPrograms?.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {profile.savedPrograms.slice(0, 3).map((prog: any) => (
                   <div key={prog._id} className="p-4 rounded-xl border border-border/60 bg-muted/20 flex gap-3 items-center">
                     <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center shrink-0 border border-border/40">
                        <GraduationCap className="h-5 w-5 text-primary" />
                     </div>
                     <div className="min-w-0">
                       <p className="text-sm font-bold truncate">{prog.name || 'Program Name'}</p>
                       <p className="text-[10px] text-muted-foreground truncate">{prog.universityName || 'University'}</p>
                     </div>
                   </div>
                 ))}
               </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                No saved programs yet. Start browsing to build your shortlist!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
