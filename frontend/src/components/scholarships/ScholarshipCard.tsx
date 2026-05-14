import { Scholarship } from '@/types/scholarship';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Building, Clock } from 'lucide-react';
import Link from 'next/link';

export function ScholarshipCard({ scholarship }: { scholarship: Scholarship }) {
  const isDeadlineSoon = () => {
    if (!scholarship.deadlineDate) return false;
    const deadline = new Date(scholarship.deadlineDate);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 14;
  };

  return (
    <Card className="group overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full bg-white">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {scholarship.imageUrl ? (
          <img
            src={scholarship.imageUrl}
            alt={scholarship.imageAlt || scholarship.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-green-50">
            <span className="text-green-800/20 font-display text-4xl font-bold px-4 text-center leading-tight">
              {scholarship.category.toUpperCase()}
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <Badge className="bg-white/90 text-slate-800 hover:bg-white backdrop-blur-sm border-none shadow-sm capitalize">
            {scholarship.category}
          </Badge>
          {isDeadlineSoon() && (
            <Badge className="bg-orange-500/90 text-white hover:bg-orange-500 backdrop-blur-sm border-none shadow-sm">
              Closing Soon
            </Badge>
          )}
        </div>
      </div>

      <CardContent className="p-5 flex-1 flex flex-col">
        {scholarship.linkedUniversity && typeof scholarship.linkedUniversity !== 'string' && (
          <div className="flex items-center gap-2 mb-3">
            {scholarship.linkedUniversity.logoUrl ? (
              <img src={scholarship.linkedUniversity.logoUrl} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Building className="w-4 h-4 text-slate-400" />
            )}
            <span className="text-xs font-medium text-slate-600 line-clamp-1">
              {scholarship.linkedUniversity.name}
            </span>
          </div>
        )}

        <h3 className="font-display font-semibold text-lg text-slate-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/scholarships/${scholarship.slug}`} className="focus:outline-none">
            <span className="absolute inset-0" aria-hidden="true" />
            {scholarship.title}
          </Link>
        </h3>

        <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
          {scholarship.shortSummary}
        </p>

        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {scholarship.deadlineDate 
                ? new Date(scholarship.deadlineDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : 'No deadline'}
            </span>
          </div>
          {scholarship.tags && scholarship.tags.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="truncate max-w-[100px]">+{scholarship.tags.length} tags</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
