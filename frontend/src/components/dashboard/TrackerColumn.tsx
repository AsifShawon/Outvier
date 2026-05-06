'use client';

import { TrackerColumn as ITrackerColumn, ApplicationTrackerItem } from '@/lib/api/applicationTracker.api';
import { TrackerCard } from './TrackerCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  MoreHorizontal, 
  GripVertical,
  Archive,
  Edit2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackerColumnProps {
  column: ITrackerColumn;
  items: ApplicationTrackerItem[];
  onAddItem: (columnId: string) => void;
  onEditItem: (item: ApplicationTrackerItem) => void;
  onEditColumn: (column: ITrackerColumn) => void;
  onArchiveColumn: (columnId: string) => void;
}

export function TrackerColumn({ 
  column, 
  items, 
  onAddItem, 
  onEditItem, 
  onEditColumn,
  onArchiveColumn 
}: TrackerColumnProps) {
  return (
    <div className="w-80 shrink-0 flex flex-col gap-4 bg-slate-50/50 rounded-3xl p-3 border border-slate-200/50">
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color || '#cbd5e1' }} 
          />
          <h3 className="font-bold text-sm text-slate-700">{column.title}</h3>
          <Badge variant="secondary" className="bg-white text-slate-500 border-slate-200 font-bold text-[10px] px-1.5 h-5">
            {items.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-slate-400 hover:text-primary hover:bg-white shadow-sm transition-all"
            onClick={() => onAddItem(column.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-primary hover:bg-white shadow-sm transition-all">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
              <DropdownMenuItem onClick={() => onEditColumn(column)} className="text-xs font-medium gap-2">
                <Edit2 className="h-3.5 w-3.5" /> Rename / Style
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onArchiveColumn(column.id)} 
                className="text-xs font-medium gap-2 text-destructive"
              >
                <Archive className="h-3.5 w-3.5" /> Archive Column
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-[500px] overflow-y-auto custom-scrollbar pr-1">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item._id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <TrackerCard 
                item={item} 
                onClick={onEditItem} 
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Applications</p>
            <Button 
              variant="link" 
              className="text-[10px] text-primary h-auto p-0 mt-2 font-bold"
              onClick={() => onAddItem(column.id)}
            >
              + Add Item
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
