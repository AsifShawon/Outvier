import Link from 'next/link';
import { MapPin, Globe, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { University } from '@/types/university';
import { cn } from '@/lib/utils';

interface UniversityCardProps {
  university: University;
}

const stateColors: Record<string, string> = {
  SA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  QLD: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  VIC: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  NSW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  WA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

export function UniversityCard({ university }: UniversityCardProps) {
  const initials = university.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('');

  return (
    <Link href={`/universities/${university.slug}`}>
      <Card className="card-hover group h-full overflow-hidden border-border/60 hover:border-primary/30 bg-card">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <CardContent className="p-5">
          {/* Logo / Initials */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg font-display border border-primary/20">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {university.name}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate">{university.location}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
            {university.description}
          </p>

          {/* Meta */}
          <div className="flex items-center flex-wrap gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                stateColors[university.state] || 'bg-muted text-muted-foreground'
              )}
            >
              {university.state}
            </span>
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {university.type === 'public' ? 'Public' : 'Private'}
            </Badge>
            {university.ranking && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Award className="h-3 w-3" />
                Rank #{university.ranking}
              </span>
            )}
            {university.establishedYear && (
              <span className="text-[10px] text-muted-foreground ml-auto">
                Est. {university.establishedYear}
              </span>
            )}
          </div>

          {/* View link */}
          <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {university.campuses?.length || 0} campus{(university.campuses?.length || 0) !== 1 ? 'es' : ''}
            </span>
            <span className="text-xs font-medium text-primary group-hover:underline">
              View Programs →
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
