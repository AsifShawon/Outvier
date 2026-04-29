import Link from 'next/link';
import { Clock, DollarSign, GraduationCap, Monitor } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Program } from '@/types/program';
import { cn } from '@/lib/utils';

interface ProgramCardProps {
  program: Program;
}

const levelColors: Record<string, string> = {
  bachelor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  master: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300',
  phd: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  diploma: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  certificate: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  graduate_certificate: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
};

const levelLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  graduate_certificate: 'Grad. Certificate',
};

const campusModeIcons: Record<string, string> = {
  'on-campus': '🏛️',
  online: '💻',
  hybrid: '🔄',
};

import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';

export function ProgramCard({ program }: ProgramCardProps) {
  const { selectedIds, addToCompare, removeFromCompare } = useComparison();
  const isSelected = selectedIds.includes(program._id);

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelected) {
      removeFromCompare(program._id);
    } else {
      addToCompare(program._id);
    }
  };

  return (
    <Link href={`/programs/${program.slug}`}>
      <Card className="card-hover group h-full overflow-hidden border-border/60 hover:border-primary/30 bg-card flex flex-col">
        <div className="h-2 bg-gradient-to-r from-violet-500 via-primary to-primary/40" />
        <CardContent className="p-5 flex-1 flex flex-col">
          {/* Level & Field */}
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide',
                levelColors[program.level]
              )}
            >
              {levelLabels[program.level]}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">{program.field}</span>
            <span className="ml-auto text-sm">{campusModeIcons[program.campusMode]}</span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
            {program.name}
          </h3>
          <p className="text-xs text-muted-foreground mb-3">{program.universityName}</p>

          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
            {program.description}
          </p>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground truncate">{program.duration}</span>
            </div>
            {program.tuitionFeeInternational && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="text-[11px] text-muted-foreground">
                  ${program.tuitionFeeInternational.toLocaleString()}/yr
                </span>
              </div>
            )}
          </div>

          {/* Intake months */}
          {program.intakeMonths && program.intakeMonths.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">
                Intake: {program.intakeMonths.join(', ')}
              </span>
            </div>
          )}

          {/* Compare Button */}
          <div className="mt-4 pt-3 border-t border-border/50">
            <Button
              size="sm"
              variant={isSelected ? "secondary" : "outline"}
              className={cn(
                "w-full gap-2 text-[11px] h-8 rounded-lg transition-all",
                isSelected && "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
              )}
              onClick={handleCompareClick}
            >
              {isSelected ? (
                <>
                  <Check className="h-3 w-3" /> Compared
                </>
              ) : (
                <>
                  <Plus className="h-3 w-3" /> Compare
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
