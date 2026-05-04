import Link from 'next/link';
import { Clock, DollarSign, GraduationCap, Monitor, Bookmark, BookmarkCheck, Building, Check, Plus, Calendar, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  bachelor: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
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

const campusModeIcons: Record<string, React.ElementType> = {
  'on-campus': Building,
  online: Monitor,
  hybrid: Clock,
};

export function ProgramCard({ program }: ProgramCardProps) {
  const { selectedIds, addToCompare, removeFromCompare } = useComparison();
  const isSelected = selectedIds.includes(program._id);
  const qc = useQueryClient();

  const { data: profileRes } = useQuery({ 
    queryKey: ['profile'], 
    queryFn: () => profileApi.getProfile(),
    staleTime: 60000 
  });
  
  const isSaved = profileRes?.data?.data?.savedPrograms?.some((p: { _id: string } | string) => (typeof p === 'string' ? p : p._id) === program._id);

  const saveMutation = useMutation({
    mutationFn: () => isSaved ? profileApi.unsaveProgram(program._id) : profileApi.saveProgram(program._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isSaved ? 'Removed from shortlist' : 'Saved to shortlist');
    }
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

  const ModeIcon = campusModeIcons[program.campusMode] || Building;

  return (
    <Link href={`/programs/${program.slug}`} className="block h-full group">
      <Card className="h-full overflow-hidden border-slate-200 dark:border-slate-800 hover:border-primary-500/50 bg-white dark:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col relative">
        
        {/* Subtle top border gradient line on hover */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-primary-500 opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-6 flex-1 flex flex-col pt-8">
          
          {/* Top Actions: Level & Save */}
          <div className="flex items-start justify-between mb-4">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide',
                levelColors[program.level] || 'bg-slate-100 text-slate-600'
              )}
            >
              <GraduationCap className="w-3 h-3 mr-1" />
              {levelLabels[program.level] || program.level}
            </span>
            
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0 rounded-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm",
                isSaved ? "text-primary-600 dark:text-primary-400" : "text-slate-400"
              )}
              onClick={handleSaveClick}
              disabled={saveMutation.isPending}
            >
              {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </Button>
          </div>

          {/* Name & University */}
          <h3 className="font-bold text-lg leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-2">
            {program.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-1.5">
            <Building className="w-4 h-4" /> {program.universityName}
          </p>

          {/* Key Details Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Tuition / Yr</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {program.tuitionFeeInternational ? `$${program.tuitionFeeInternational.toLocaleString()}` : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Duration</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {program.duration || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Intakes</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                {program.intakeMonths?.join(', ') || 'Varies'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1"><ModeIcon className="w-3 h-3" /> Mode</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                {program.campusMode || 'On-campus'}
              </span>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3">
            <Button
              size="sm"
              variant={isSelected ? "secondary" : "outline"}
              className={cn(
                "flex-1 h-10 rounded-xl font-semibold transition-all border-slate-200 dark:border-slate-700",
                isSelected && "bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-200 dark:border-primary-500/30"
              )}
              onClick={handleCompareClick}
            >
              {isSelected ? (
                <><Check className="w-4 h-4 mr-2" /> Compared</>
              ) : (
                <><Plus className="w-4 h-4 mr-2" /> Compare</>
              )}
            </Button>
            
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-primary-600 group-hover:text-white transition-colors">
               <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
