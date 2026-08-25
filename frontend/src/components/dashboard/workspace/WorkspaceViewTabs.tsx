'use client';

import { Kanban, ListFilter, Calendar, FileSpreadsheet, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type WorkspaceViewMode = 'board' | 'list' | 'calendar' | 'detail';

interface WorkspaceViewTabsProps {
  currentView: WorkspaceViewMode;
  onViewChange: (view: WorkspaceViewMode) => void;
  onNewApplication: () => void;
  selectedAppTitle?: string;
}

export function WorkspaceViewTabs({
  currentView,
  onViewChange,
  onNewApplication,
  selectedAppTitle,
}: WorkspaceViewTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
      {/* View Switcher Pills */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-2xl w-fit">
        <button
          onClick={() => onViewChange('board')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            currentView === 'board'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Kanban className="h-3.5 w-3.5" />
          <span>Board View</span>
        </button>

        <button
          onClick={() => onViewChange('list')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            currentView === 'list'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>List View</span>
        </button>

        <button
          onClick={() => onViewChange('calendar')}
          className={cn(
            'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
            currentView === 'calendar'
              ? 'bg-card text-primary shadow-xs'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Deadlines</span>
        </button>

        {selectedAppTitle && (
          <button
            onClick={() => onViewChange('detail')}
            className={cn(
              'flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
              currentView === 'detail'
                ? 'bg-card text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span className="max-w-[120px] truncate">{selectedAppTitle}</span>
          </button>
        )}
      </div>

      {/* Primary New Application Action */}
      <Button
        type="button"
        onClick={onNewApplication}
        size="sm"
        className="text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs"
      >
        <Plus className="h-4 w-4" />
        New Application
      </Button>
    </div>
  );
}
