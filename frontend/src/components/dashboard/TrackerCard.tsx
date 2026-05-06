'use client';

import { ApplicationTrackerItem } from '@/lib/api/applicationTracker.api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  FileText, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TrackerCardProps {
  item: ApplicationTrackerItem;
  onClick: (item: ApplicationTrackerItem) => void;
}

export function TrackerCard({ item, onClick }: TrackerCardProps) {
  const completedDocs = item.documentChecklist?.filter(d => d.status === 'completed' || d.status === 'verified').length || 0;
  const totalDocs = item.documentChecklist?.length || 0;
  
  const completedTasks = item.tasks?.filter(t => t.completed).length || 0;
  const totalTasks = item.tasks?.length || 0;

  const isOverdue = item.deadline && new Date(item.deadline) < new Date() && !item.archived;

  return (
    <Card 
      className="group relative rounded-2xl border-slate-200 shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer bg-white overflow-hidden"
      onClick={() => onClick(item)}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="flex flex-wrap gap-1">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[9px] uppercase font-bold py-0 h-4",
                item.priority === 'high' ? 'text-red-500 border-red-100 bg-red-50' : 
                item.priority === 'medium' ? 'text-amber-500 border-amber-100 bg-amber-50' : 
                'text-slate-400 border-slate-100 bg-slate-50'
              )}
            >
              {item.priority}
            </Badge>
            {item.itemType !== 'custom' && (
              <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 h-4 bg-slate-100 text-slate-500 border-none">
                {item.itemType}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="h-3 w-3 text-slate-400" />
          </Button>
        </div>

        <div>
          <h4 className="font-bold text-sm text-slate-900 leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          {item.subtitle && (
            <p className="text-[10px] text-slate-400 font-medium truncate mt-1">
              {item.subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {item.deadline && (
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full",
              isOverdue ? "text-red-600 bg-red-50" : "text-slate-500 bg-slate-50"
            )}>
              <Calendar className="h-3 w-3" />
              {format(new Date(item.deadline), 'MMM d, yyyy')}
            </div>
          )}
          {item.intake && (
            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              <Clock className="h-3 w-3" />
              {item.intake}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold" title="Documents">
               <FileText className="h-3 w-3" />
               {completedDocs}/{totalDocs}
             </div>
             {totalTasks > 0 && (
               <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold" title="Tasks">
                 <CheckCircle2 className="h-3 w-3" />
                 {completedTasks}/{totalTasks}
               </div>
             )}
          </div>
          <div className="text-[10px] text-slate-300 font-medium">
            {format(new Date(item.updatedAt), 'MMM d')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
