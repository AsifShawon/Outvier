'use client';

import { useQuery } from '@tanstack/react-query';
import { comparisonApi } from '@/lib/api/comparison.api';
import { useComparison } from '@/context/ComparisonContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  InfoIcon, 
  ArrowRight, 
  Settings2, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export default function StudentFitPage() {
  const { hash, selectedIds } = useComparison();

  const { data: scoresRes, isLoading } = useQuery({
    queryKey: ['fit-scores', hash],
    queryFn: () => comparisonApi.getScores(hash!),
    enabled: !!hash,
  });

  const scores = scoresRes?.data?.data || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-600 border-green-500/20';
    if (score >= 50) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-3 w-3 mr-1" />;
    if (score >= 50) return <AlertCircle className="h-3 w-3 mr-1" />;
    return <XCircle className="h-3 w-3 mr-1" />;
  };

  if (isLoading) {
    return <div className="p-10 text-center">Calculating your fit scores...</div>;
  }

  if (selectedIds.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl py-20 px-4 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <BarChart3 className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-bold font-display mb-3">No programs to compare</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Add some programs to your comparison shortlist to see how well they match your profile and preferences.
        </p>
        <Link href="/programs">
          <Button size="lg" className="px-8">Browse Programs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-10 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Outvier Fit Score</h1>
          <p className="text-muted-foreground mt-1">Deep analysis of how well your short-listed programs align with your profile.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard/profile">
            <Button variant="outline" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Update My Profile
            </Button>
          </Link>
          <Link href={`/compare/${hash}`}>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              View Full Comparison
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-8">
        {/* Help Info */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 flex gap-3 items-start">
          <InfoIcon className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700/80">
            <strong className="text-blue-900">How we calculate this:</strong> We use your preferred budget, English scores (IELTS/PTE), and state preferences to determine a weighted score for each program. A score above 80 indicates an excellent match for your current profile.
          </div>
        </div>

        {/* Breakdown Table */}
        <Card className="border-border/60 shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Individual component scores for your shortlisted programs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[250px] pl-6">Program & University</TableHead>
                  <TableHead className="text-center">Affordability</TableHead>
                  <TableHead className="text-center">Admission Match</TableHead>
                  <TableHead className="text-center">Location</TableHead>
                  <TableHead className="text-center">Ranking</TableHead>
                  <TableHead className="text-center">Employability</TableHead>
                  <TableHead className="text-center pr-6">Total Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scores.map((score: any) => (
                  <TableRow key={score.programId} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <div className="font-bold text-foreground line-clamp-1">{score.programName}</div>
                      <div className="text-xs text-muted-foreground">{score.universityName}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("font-mono font-bold", getScoreColor(score.breakdown.affordability))}>
                        {getScoreIcon(score.breakdown.affordability)}
                        {score.breakdown.affordability}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("font-mono font-bold", getScoreColor(score.breakdown.admissionMatch))}>
                        {getScoreIcon(score.breakdown.admissionMatch)}
                        {score.breakdown.admissionMatch}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("font-mono font-bold", getScoreColor(score.breakdown.location))}>
                        {getScoreIcon(score.breakdown.location)}
                        {score.breakdown.location}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("font-mono font-bold", getScoreColor(score.breakdown.ranking))}>
                        {getScoreIcon(score.breakdown.ranking)}
                        {score.breakdown.ranking}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("font-mono font-bold", getScoreColor(score.breakdown.employability))}>
                        {getScoreIcon(score.breakdown.employability)}
                        {score.breakdown.employability}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center pr-6">
                      <div className="text-lg font-black font-display text-primary">
                        {score.totalScore}%
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed Reasons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scores.map((score: any) => (
            <Card key={`reasons-${score.programId}`} className="border-border/60 shadow-sm h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-bold">{score.programName}</CardTitle>
                  <div className="text-xl font-black font-display text-primary">{score.totalScore}%</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {score.reasons.map((reason: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm text-muted-foreground items-start">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  {score.reasons.length === 0 && (
                    <div className="text-sm text-muted-foreground italic">No specific insights available.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
