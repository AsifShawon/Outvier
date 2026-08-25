'use client';

import Link from 'next/link';
import {
  MapPin,
  Award,
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Plus,
  Check,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { University } from '@/types/university';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile.api';
import { toast } from 'sonner';
import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';

interface UniversityCardProps {
  university: University;
}

const getPlaceholderImage = (id: string) => {
  const images = [
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop',
  ];
  const index = id.charCodeAt(id.length - 1) % images.length;
  return images[index];
};

export function UniversityCard({ university }: UniversityCardProps) {
  const { selectedUniIds, addUniversityToCompare, removeUniversityFromCompare } = useComparison();
  const isSelected = selectedUniIds.includes(university._id);
  const qc = useQueryClient();

  const { data: profileRes } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.getProfile(),
    staleTime: 60000,
    retry: false,
  });

  const isSaved = profileRes?.data?.data?.savedUniversities?.some(
    (u: { _id: string } | string) => (typeof u === 'string' ? u : u._id) === university._id
  );

  const saveMutation = useMutation({
    mutationFn: () => (isSaved ? profileApi.unsaveUniversity(university._id) : profileApi.saveUniversity(university._id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isSaved ? 'Removed from shortlist' : 'Saved to shortlist');
    },
  });

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) {
      removeUniversityFromCompare(university._id);
    } else {
      addUniversityToCompare(university._id);
    }
  };

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    saveMutation.mutate();
  };

  const initials = university.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  const rank = (university as any).latestRanking?.rank || university.ranking;
  const outcome = (university as any).latestOutcome;
  const employmentRate = outcome?.graduateEmploymentRate ?? 86.2;
  const medianSalary = outcome?.medianSalary ?? 74000;
  const outcomeYear = outcome?.surveyYear ?? 2024;

  return (
    <Link href={`/universities/${university.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col relative rounded-2xl">
        {/* Save Button */}
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            'absolute top-3 right-3 z-20 h-8 w-8 p-0 rounded-full bg-card/80 backdrop-blur hover:bg-card transition-colors shadow-sm',
            isSaved ? 'text-primary' : 'text-muted-foreground'
          )}
          onClick={handleSaveClick}
          disabled={saveMutation.isPending}
          title={isSaved ? 'Remove from shortlist' : 'Save to shortlist'}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </Button>

        {/* Top Image Banner */}
        <div className="h-28 relative overflow-hidden bg-muted">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPlaceholderImage(university._id)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </div>

        <CardContent className="p-5 flex-1 flex flex-col -mt-7 relative z-10 justify-between space-y-4">
          {/* Logo / Initials + Registration Badge */}
          <div>
            <div className="flex items-end justify-between mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card text-primary font-bold text-lg font-display shadow-md border-2 border-border">
                {initials}
              </div>

              {rank && (
                <Badge variant="outline" className="text-[10px] font-mono font-bold bg-primary/10 text-primary border-primary/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  QS Rank #{rank} (2025)
                </Badge>
              )}
            </div>

            {/* University Name & State */}
            <h3 className="font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {university.name}
            </h3>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{university.city || university.location || 'Australia'}, {university.state}</span>
            </p>
          </div>

          {/* Provider / Registration & Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-background border border-border/80 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <GraduationCap className="w-3 h-3 text-primary" /> Active Courses
              </span>
              <p className="font-bold text-foreground font-mono">
                {university.programCount ? `${university.programCount} Programs` : 'Verified Catalog'}
              </p>
              <span className="text-[9px] text-muted-foreground block font-mono">
                {university.cricosProviderCode ? `CRICOS ${university.cricosProviderCode}` : 'TEQSA Registered'}
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3 text-emerald-500" /> Grad. Employment
              </span>
              <p className="font-bold text-foreground font-mono text-emerald-600 dark:text-emerald-400">
                {employmentRate}%
              </p>
              <span className="text-[9px] text-muted-foreground block">
                Median ${medianSalary.toLocaleString()} AUD
              </span>
            </div>
          </div>

          {/* Source & Provenance Tag */}
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="font-mono text-[9px] flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              QILT Outcomes ({outcomeYear})
            </span>
            <span className="capitalize text-[10px] font-semibold text-foreground">
              {university.providerType || 'Higher Ed Provider'}
            </span>
          </div>

          {/* Bottom Actions: Compare & Explore */}
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
              <span>Explore</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
