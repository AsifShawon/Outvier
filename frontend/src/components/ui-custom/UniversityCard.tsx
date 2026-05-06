import Link from 'next/link';
import { MapPin, Award, Bookmark, BookmarkCheck, Building, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { University } from '@/types/university';
import { cn } from '@/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/profile.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface UniversityCardProps {
  university: University;
}

const stateColors: Record<string, string> = {
  SA: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  QLD: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  VIC: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
  NSW: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  WA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
};

// Add a placeholder image generator based on the state or name
const getPlaceholderImage = (id: string) => {
  const images = [
    'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=800&auto=format&fit=crop',
  ];
  // Simple deterministic pick
  const index = id.charCodeAt(id.length - 1) % images.length;
  return images[index];
};

export function UniversityCard({ university }: UniversityCardProps) {
  const qc = useQueryClient();
  const { data: profileRes } = useQuery({ 
    queryKey: ['profile'], 
    queryFn: () => profileApi.getProfile(),
    staleTime: 60000 
  });
  
  const isSaved = profileRes?.data?.data?.savedUniversities?.some((u: { _id: string } | string) => (typeof u === 'string' ? u : u._id) === university._id);

  const saveMutation = useMutation({
    mutationFn: () => isSaved ? profileApi.unsaveUniversity(university._id) : profileApi.saveUniversity(university._id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success(isSaved ? 'Removed from shortlist' : 'Saved to shortlist');
    }
  });

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

  return (
    <Link href={`/universities/${university.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden border-slate-200 dark:border-slate-800 hover:border-primary-500/50 dark:hover:border-primary-500/50 bg-white dark:bg-slate-900 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col relative">
        
        {/* Fit Score Badge Placeholder */}
        <div className="absolute top-3 left-3 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border border-green-500/30 text-green-600 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> 94% Match
        </div>

        {/* Save Button */}
        <Button
          size="sm"
          variant="ghost"
          className={cn(
            "absolute top-3 right-3 z-20 h-8 w-8 p-0 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm",
            isSaved ? "text-primary-600 dark:text-primary-400" : "text-slate-600 dark:text-slate-400"
          )}
          onClick={handleSaveClick}
          disabled={saveMutation.isPending}
        >
          {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
        </Button>

        {/* Top Image Banner */}
        <div className="h-32 relative overflow-hidden bg-slate-100 dark:bg-slate-800">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPlaceholderImage(university._id)})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        </div>

        <CardContent className="p-5 flex-1 flex flex-col -mt-8 relative z-10">
          {/* Logo / Initials */}
          <div className="flex justify-between items-end mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 font-bold text-xl font-display shadow-md border-4 border-white dark:border-slate-900">
              {initials}
            </div>
            
            <div className="flex gap-2">
              <span className={cn('px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide', university.state ? (stateColors[university.state] ?? 'bg-slate-100 text-slate-600') : 'bg-slate-100 text-slate-600')}>
                {university.state}
              </span>
              <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {university.type}
              </span>
            </div>
          </div>

          <h3 className="font-bold text-base leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 mb-1">
            {university.name}
          </h3>
          
          <div className="flex items-center gap-1 mb-4">
            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{university.location}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {university.ranking && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                <Award className="h-4 w-4 text-amber-500" />
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Global Rank</div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">#{university.ranking}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
              <Building className="h-4 w-4 text-primary-500" />
              <div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">Campuses</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{university.campuses?.length || 1}</div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:underline">
               Explore Programs <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
             </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
