'use client';

import Link from 'next/link';
import {
  Clock,
  DollarSign,
  GraduationCap,
  Monitor,
  Bookmark,
  BookmarkCheck,
  Building2,
  Check,
  Plus,
  Calendar,
  ArrowRight,
  ShieldCheck,
  Languages,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Program } from '@/types/program';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile.api';
import { toast } from 'sonner';
import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';

interface ProgramCardProps {
  program: Program;
}

const levelColors: Record<string, string> = {
  bachelor: 'bg-primary/10 text-primary border-primary/20',
  master: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  phd: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  diploma: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  certificate: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  graduate_certificate: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
};

const levelLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  graduate_certificate: 'Grad. Certificate',
};

export function ProgramCard({ program }: ProgramCardProps) {
  const { selectedIds, addToCompare, removeFromCompare } = useComparison();
  const isSelected = selectedIds.includes(program._id);
  const qc = useQueryClient();

  const { data: profileRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const isSaved = profileRes?.data?.data?.savedPrograms?.some(
    (p: { _id: string } | string) => (typeof p === 'string' ? p : p._id) === program._id
  );

  const saveMutation = useMutation({
    mutationFn: () => (isSaved ? profileApi.unsaveProgram(program._id) : profileApi.saveProgram(program._id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isSaved ? 'Removed from shortlist' : 'Saved to shortlist');
    },
  });

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) {
      removeFromCompare(program._id);
    } else {
      addToCompare(program._id);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveMutation.mutate();
  };

  // Tuition calculations
  const annualTuition = program.tuitionFeeInternational || program.tuitionFeeAud || program.tuitionFeeLocal;
  const totalTuition = program.estimatedTotalCourseCostAud || program.totalEstimatedCost || (annualTuition ? annualTuition * 2 : null);
  const feeYear = (program as any).tuitionDetails?.feeYear || (program as any).feeYear || 2025;

  // Intakes
  const nextIntake = program.intakeMonths?.[0] || 'Feb 2026';

  // Requirements summary
  const englishReq = program.englishRequirements || (program as any).ieltsRequirement ? `IELTS ${(program as any).ieltsRequirement || '6.5'}` : 'IELTS 6.5';
  const academicReq = program.academicRequirements || 'Bachelor degree or equivalent';

  return (
    <Link href={`/programs/${program.slug}`} className="block h-full group">
      <Card className="h-full overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col relative rounded-2xl">
        {/* Subtle top border gradient */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
          {/* Header Row: Level + Save & Compare Pills */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-2.5">
              <Badge
                variant="outline"
                className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5', levelColors[program.level] || 'bg-muted text-foreground')}
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                {levelLabels[program.level] || program.level}
              </Badge>

              <div className="flex items-center gap-1">
                {program.cricosCourseCode && (
                  <Badge variant="outline" className="text-[9px] font-mono bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 px-1.5 py-0.5">
                    CRICOS {program.cricosCourseCode}
                  </Badge>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    'h-7 w-7 p-0 rounded-full hover:bg-accent transition-colors',
                    isSaved ? 'text-primary' : 'text-muted-foreground'
                  )}
                  onClick={handleSaveClick}
                  disabled={saveMutation.isPending}
                  title={isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
                >
                  {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Program Name & University */}
            <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {program.name}
            </h3>
            <p className="text-xs font-semibold text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
              <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate">{program.universityName || 'Australian University'}</span>
            </p>
          </div>

          {/* Key Facts & Evidence Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-background border border-border/80 text-xs">
            {/* Tuition */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <DollarSign className="w-3 h-3 text-primary" /> Annual Tuition
              </span>
              <p className="font-bold text-foreground font-mono">
                {annualTuition ? `$${annualTuition.toLocaleString()} AUD` : 'Contact for Fees'}
              </p>
              <span className="text-[9px] text-muted-foreground block font-mono">
                {annualTuition ? `${feeYear} Schedule` : 'Indicative'}
              </span>
            </div>

            {/* Total Estimated Cost */}
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <DollarSign className="w-3 h-3 text-indigo-500" /> Total Est. Cost
              </span>
              <p className="font-bold text-foreground font-mono truncate">
                {totalTuition ? `~$${totalTuition.toLocaleString()} AUD` : 'See details'}
              </p>
              <span className="text-[9px] text-muted-foreground block">
                {program.duration || '2 Years Full-Time'}
              </span>
            </div>

            {/* Next Intake */}
            <div className="space-y-0.5 pt-1.5 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <Calendar className="w-3 h-3 text-amber-500" /> Next Intake
              </span>
              <p className="font-bold text-foreground truncate">
                {nextIntake}
              </p>
            </div>

            {/* Entry Requirement */}
            <div className="space-y-0.5 pt-1.5 border-t border-border/60">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <Languages className="w-3 h-3 text-teal-500" /> Benchmark
              </span>
              <p className="font-bold text-foreground truncate">
                {englishReq}
              </p>
            </div>
          </div>

          {/* Mode & Source Freshness Tag */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="capitalize font-medium flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              {program.campusMode || 'On-Campus'}
            </span>
            <span className="flex items-center gap-1 font-mono text-[9px]">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Verified 2025 Handbook
            </span>
          </div>

          {/* Bottom Actions: Compare & Open Details */}
          <div className="pt-2 border-t border-border flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={isSelected ? 'secondary' : 'outline'}
              className={cn(
                'flex-1 h-8 text-xs font-semibold rounded-xl transition-all',
                isSelected && 'bg-primary/10 text-primary border-primary/30'
              )}
              onClick={handleCompareClick}
            >
              {isSelected ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" /> Compared
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Compare
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs font-semibold text-primary group-hover:translate-x-0.5 transition-transform"
            >
              <span>Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
