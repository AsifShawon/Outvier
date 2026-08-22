'use client';

import { useState } from 'react';
import { ApplicationTrackerItem, TrackerColumn } from '@/lib/api/applicationTracker.api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronDown, ChevronUp, Calendar, Clock, FileText, ArrowRight, GraduationCap, Award, Plane, Wrench } from 'lucide-react';
import { format, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MobileTrackerViewProps {
  columns: TrackerColumn[];
  items: ApplicationTrackerItem[];
  onAddItem: (columnId?: string) => void;
  onEditItem: (item: ApplicationTrackerItem) => void;
  onMoveItem: (id: string, toColumnId: string) => Promise<void>;
  onArchiveItem?: (item: ApplicationTrackerItem) => void | Promise<void>;
  showArchived?: boolean;
  onToggleArchived?: () => void;
  archivedCount?: number;
}

const TYPE_ICONS: Record<string, any> = {
  university: GraduationCap, program: GraduationCap, scholarship: Award, visa: Plane, custom: Wrench
};

function MobileCard({ item, columns, onEditItem, onMoveItem }: {
  item: ApplicationTrackerItem;
  columns: TrackerColumn[];
  onEditItem: (item: ApplicationTrackerItem) => void;
  onMoveItem: (id: string, toColumnId: string) => Promise<void>;
}) {
  const TypeIcon = TYPE_ICONS[item.itemType] || Wrench;
  const deadlineDate = item.deadline ? new Date(item.deadline) : null;
  const isOverdue = deadlineDate && isBefore(deadlineDate, new Date()) && !item.archived;
  const completedDocs = item.documentChecklist?.filter(d => ['completed', 'verified', 'uploaded', 'submitted'].includes(d.status)).length || 0;
  const totalDocs = item.documentChecklist?.length || 0;

  return (
    <div
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-2.5 active:scale-[0.99] transition-transform"
      onClick={() => onEditItem(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={cn(
            'p-1.5 rounded-lg shrink-0',
            item.itemType === 'scholarship' ? 'bg-amber-50 text-amber-600' :
            item.itemType === 'visa' ? 'bg-sky-50 text-sky-600' :
            item.itemType === 'program' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
          )}>
            <TypeIcon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-[14px] text-slate-900 leading-snug line-clamp-2">{item.title}</h4>
            {item.subtitle && <p className="text-[11px] text-slate-400 font-medium truncate">{item.subtitle}</p>}
          </div>
        </div>
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
          item.priority === 'high' ? 'bg-red-50 text-red-500' :
          item.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-400'
        )}>
          {item.priority}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {item.country && <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-full px-2 py-0.5">{item.country}</span>}
        {item.intake && (
          <span className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
            <Clock className="h-2.5 w-2.5" />{item.intake}
          </span>
        )}
        {deadlineDate && (
          <span className={cn('flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5',
            isOverdue ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500')}>
            <Calendar className="h-2.5 w-2.5" />
            {format(deadlineDate, 'MMM d, yyyy')}
            {isOverdue && ' · Overdue'}
          </span>
        )}
      </div>

      {totalDocs > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 font-medium flex items-center gap-1"><FileText className="h-3 w-3" /> {completedDocs}/{totalDocs} docs</span>
            <span className="font-bold text-slate-500">{Math.round((completedDocs / totalDocs) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(completedDocs / totalDocs) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Move action */}
      <div className="flex items-center pt-1 border-t border-slate-50" onClick={e => e.stopPropagation()}>
        <ArrowRight className="h-3.5 w-3.5 text-slate-300 mr-2 shrink-0" />
        <Select value={item.columnId} onValueChange={async (v) => {
          if (!v) return;
          const colName = columns.find(c => c.id === v)?.title;
          await onMoveItem(item._id, v);
          toast.success(`Moved to ${colName}`);
        }}>
          <SelectTrigger className="h-7 border-none bg-transparent text-[11px] font-bold text-slate-400 hover:text-primary p-0 shadow-none">
            <span className="text-slate-300 mr-1">Move to:</span><SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {columns.filter(c => c.id !== item.columnId).map(col => (
              <SelectItem key={col.id} value={col.id} className="text-sm">{col.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function MobileTrackerView({ columns, items, onAddItem, onEditItem, onMoveItem }: MobileTrackerViewProps) {
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());

  const toggleColumn = (columnId: string) => {
    const next = new Set(collapsedColumns);
    if (next.has(columnId)) next.delete(columnId);
    else next.add(columnId);
    setCollapsedColumns(next);
  };

  const activeColumns = columns.filter(c => !c.isArchived);

  return (
    <div className="space-y-3 pb-24">
      {activeColumns.map(column => {
        const columnItems = items.filter(i => i.columnId === column.id);
        const isCollapsed = collapsedColumns.has(column.id);

        return (
          <div key={column.id} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
            {/* Column header */}
            <button
              onClick={() => toggleColumn(column.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: column.color || '#cbd5e1' }} />
                <span className="font-bold text-[14px] text-slate-800">{column.title}</span>
                <Badge className="text-[10px] font-bold h-5 px-1.5 rounded-full bg-slate-100 text-slate-500 border-none">
                  {columnItems.length}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={e => { e.stopPropagation(); onAddItem(column.id); }}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronUp className="h-4 w-4 text-slate-400" />}
              </div>
            </button>

            {/* Cards */}
            {!isCollapsed && (
              <div className="px-3 pb-3 space-y-2.5">
                {columnItems.map(item => (
                  <MobileCard key={item._id} item={item} columns={activeColumns} onEditItem={onEditItem} onMoveItem={onMoveItem} />
                ))}
                {columnItems.length === 0 && (
                  <div className="text-center py-6 text-slate-300">
                    <p className="text-sm font-medium">No items here</p>
                    <button onClick={() => onAddItem(column.id)} className="text-xs font-bold text-primary mt-1 hover:underline">
                      + Add item
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
