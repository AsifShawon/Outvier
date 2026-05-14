'use client';

import { TrackerColumn as ITrackerColumn, ApplicationTrackerItem } from '@/lib/api/applicationTracker.api';
import { TrackerCard } from './TrackerCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Plus, MoreHorizontal, Archive, Edit2, AlertCircle, Sparkles,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';

// Friendly empty-column prompts per column title
const COLUMN_HINTS: Record<string, string> = {
  'Researching':  'Browse programs and drag them here.',
  'Shortlisted':  'Strong choices you want to compare.',
  'Preparing':    'Gathering documents and checking eligibility.',
  'Applied':      'You have submitted applications here.',
  'Offer':        'Congrats — offers received go here.',
  'Onboarding':   'Visa, payment, and enrollment steps.',
  'Archived':     'Rejected or cancelled applications.',
};

interface TrackerColumnProps {
  column: ITrackerColumn;
  items: ApplicationTrackerItem[];
  nextColumn?: ITrackerColumn;
  onAddItem: (columnId: string) => void;
  onEditItem: (item: ApplicationTrackerItem) => void;
  onMoveItem: (id: string, toColumnId: string) => void;
  onArchiveItem: (item: ApplicationTrackerItem) => void;
  onEditColumn: (column: ITrackerColumn) => void;
  onArchiveColumn: (columnId: string) => void;
}

export function TrackerColumn({
  column,
  items,
  nextColumn,
  onAddItem,
  onEditItem,
  onMoveItem,
  onArchiveItem,
  onEditColumn,
  onArchiveColumn,
}: TrackerColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  const isOverWipLimit = column.wipLimit !== undefined && items.length > column.wipLimit;
  const isAtWipLimit   = column.wipLimit !== undefined && items.length >= column.wipLimit;
  const hint = column.description || COLUMN_HINTS[column.title] || '';

  return (
    <div className={cn(
      'w-[272px] shrink-0 flex flex-col rounded-2xl border transition-colors duration-200',
      isOver ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-slate-200/70 bg-slate-50/60',
    )}>
      {/* Column Header */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: column.color || '#cbd5e1' }}
            />
            <h3 className="font-bold text-[13px] text-slate-700 leading-tight truncate">{column.title}</h3>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Badge
              variant="secondary"
              className={cn(
                'font-bold text-[10px] px-1.5 h-5 rounded-full min-w-[20px] flex items-center justify-center',
                isOverWipLimit ? 'bg-red-100 text-red-600' :
                isAtWipLimit   ? 'bg-amber-100 text-amber-600' :
                'bg-white text-slate-400 border border-slate-200'
              )}
            >
              {items.length}{column.wipLimit ? `/${column.wipLimit}` : ''}
            </Badge>

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-lg text-slate-400 hover:text-primary hover:bg-white transition-all"
              onClick={e => { e.stopPropagation(); onAddItem(column.id); }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-white transition-all">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-slate-200 w-44 shadow-lg">
                <DropdownMenuItem onClick={() => onEditColumn(column)} className="text-xs font-medium gap-2 rounded-lg">
                  <Edit2 className="h-3.5 w-3.5" /> Rename / Style
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onArchiveColumn(column.id)}
                  className="text-xs font-medium gap-2 text-destructive rounded-lg"
                >
                  <Archive className="h-3.5 w-3.5" /> Hide Column
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isOverWipLimit && (
          <div className="flex items-center gap-1 mt-1 pl-4 text-[10px] font-bold text-red-500">
            <AlertCircle className="h-3 w-3" /> WIP limit exceeded
          </div>
        )}
      </div>

      {/* Cards area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex flex-col gap-2 px-2 pb-2 flex-1 overflow-y-auto transition-colors',
          'max-h-[calc(100vh-280px)] min-h-[80px]',
          isOver && 'bg-primary/[0.04] rounded-xl',
        )}
        style={{ scrollbarWidth: 'thin' }}
      >
        <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {items.map(item => (
              <motion.div
                key={item._id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <TrackerCard
                  item={item}
                  onClick={onEditItem}
                  onMoveNext={nextColumn ? (i) => onMoveItem(i._id, nextColumn.id) : undefined}
                  nextColumnName={nextColumn?.title}
                  onArchive={onArchiveItem}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Empty state per column */}
        {items.length === 0 && (
          <div
            className={cn(
              'flex flex-col items-center justify-center py-6 px-3 text-center rounded-xl transition-colors',
              'border-2 border-dashed',
              isOver ? 'border-primary/50 bg-primary/5' : 'border-slate-200/60',
            )}
          >
            {hint && (
              <p className="text-[10px] font-medium text-slate-400 mb-2 leading-relaxed">{hint}</p>
            )}
            <button
              onClick={() => onAddItem(column.id)}
              className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors hover:underline"
            >
              + Add card
            </button>
          </div>
        )}
      </div>

      {/* Bottom add button */}
      <div className="px-2 pb-2 pt-1 border-t border-slate-200/40 shrink-0">
        <button
          onClick={() => onAddItem(column.id)}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-bold text-slate-400 hover:text-primary rounded-xl hover:bg-white transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          Add card
        </button>
      </div>
    </div>
  );
}
