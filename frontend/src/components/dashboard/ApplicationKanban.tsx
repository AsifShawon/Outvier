'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  applicationTrackerApi, 
  ApplicationTrackerItem, 
  TrackerColumn as ITrackerColumn,
  TrackerBoard
} from '@/lib/api/applicationTracker.api';
import { TrackerColumn } from './TrackerColumn';
import { TrackerItemDialog } from './TrackerItemDialog';
import { TrackerColumnDialog } from './TrackerColumnDialog';
import { BoardSettingsDialog } from './BoardSettingsDialog';
import { TrackerFilters } from './TrackerFilters';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  Settings2, 
  Layout, 
  ChevronRight,
  ChevronLeft,
  Loader2,
  Sliders
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export function ApplicationKanban() {
  const qc = useQueryClient();
  
  // State
  const [filters, setFilters] = useState<any>({ archived: 'false' });
  const [selectedItem, setSelectedItem] = useState<Partial<ApplicationTrackerItem> | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<Partial<ITrackerColumn> | null>(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // Queries
  const { data: boardRes, isLoading: isLoadingBoard } = useQuery({
    queryKey: ['tracker-board'],
    queryFn: () => applicationTrackerApi.getBoard(),
  });

  const { data: itemsRes, isLoading: isLoadingItems } = useQuery({
    queryKey: ['tracker-items', filters],
    queryFn: () => applicationTrackerApi.getItems(filters),
  });

  const board = boardRes?.data?.data;
  const items = itemsRes?.data?.data || [];
  const columns = board?.columns || [];

  // Mutations
  const updateBoardMutation = useMutation({
    mutationFn: (settings: any) => applicationTrackerApi.updateBoard({ settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-board'] });
      toast.success('Board settings updated');
    }
  });

  const saveItemMutation = useMutation({
    mutationFn: (data: any) => 
      selectedItem?._id 
        ? applicationTrackerApi.updateItem(selectedItem._id, data)
        : applicationTrackerApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      toast.success(selectedItem?._id ? 'Application updated' : 'Application created');
      setIsItemDialogOpen(false);
    }
  });

  const archiveItemMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string, archived: boolean }) => 
      applicationTrackerApi.archiveItem(id, archived),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      toast.success('Application visibility updated');
      setIsItemDialogOpen(false);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => applicationTrackerApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      toast.success('Application removed');
      setIsItemDialogOpen(false);
    }
  });

  const saveColumnMutation = useMutation({
    mutationFn: (data: any) => 
      selectedColumn?.id 
        ? applicationTrackerApi.updateColumn(selectedColumn.id, data)
        : applicationTrackerApi.addColumn(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-board'] });
      toast.success(selectedColumn?.id ? 'Column updated' : 'Column added');
      setIsColumnDialogOpen(false);
    }
  });

  const archiveColumnMutation = useMutation({
    mutationFn: (id: string) => applicationTrackerApi.updateColumn(id, { isArchived: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-board'] });
      toast.success('Column archived');
    }
  });

  // Handlers
  const handleAddItem = (columnId?: string) => {
    setSelectedItem({ columnId });
    setIsItemDialogOpen(true);
  };

  const handleEditItem = (item: ApplicationTrackerItem) => {
    setSelectedItem(item);
    setIsItemDialogOpen(true);
  };

  const handleAddColumn = () => {
    setSelectedColumn(null);
    setIsColumnDialogOpen(true);
  };

  const handleEditColumn = (column: ITrackerColumn) => {
    setSelectedColumn(column);
    setIsColumnDialogOpen(true);
  };

  if (isLoadingBoard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading your board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-6">
        <TrackerFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          onClear={() => setFilters({ archived: 'false' })} 
        />
        <div className="flex items-center gap-2 shrink-0">
          <Button 
            onClick={() => setIsSettingsDialogOpen(true)}
            variant="outline" 
            className="rounded-xl border-slate-200 h-11 px-4 font-bold text-slate-600 hover:text-primary hover:border-primary/50 transition-all gap-2"
          >
            <Sliders className="h-4 w-4" />
            Board Settings
          </Button>
          <Button 
            onClick={handleAddColumn}
            variant="outline" 
            className="rounded-xl border-slate-200 h-11 px-4 font-bold text-slate-600 hover:text-primary hover:border-primary/50 transition-all gap-2"
          >
            <Settings2 className="h-4 w-4" />
            Manage Columns
          </Button>
          <Button 
            onClick={() => handleAddItem()}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 h-11 px-6 font-bold text-white shadow-xl shadow-slate-900/10 gap-2"
          >
            <Plus className="h-4 w-4" />
            New Application
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="overflow-x-auto pb-8 custom-scrollbar scroll-smooth">
          <div className="flex gap-6 min-w-max">
            {columns.filter(c => !c.isArchived).map((column) => (
              <TrackerColumn 
                key={column.id}
                column={column}
                items={items.filter(item => item.columnId === column.id)}
                onAddItem={handleAddItem}
                onEditItem={handleEditItem}
                onEditColumn={handleEditColumn}
                onArchiveColumn={(id) => archiveColumnMutation.mutate(id)}
              />
            ))}
            
            <button 
              onClick={handleAddColumn}
              className="w-80 shrink-0 h-[600px] rounded-3xl border-2 border-dashed border-slate-200 hover:border-primary/30 hover:bg-slate-50 transition-all flex flex-col items-center justify-center group"
            >
              <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="h-6 w-6 text-slate-400 group-hover:text-primary" />
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-4 group-hover:text-primary">Add Stage</p>
            </button>
          </div>
        </div>
      </div>

      {/* Management Dialogs */}
      <TrackerItemDialog 
        isOpen={isItemDialogOpen}
        onClose={() => setIsItemDialogOpen(false)}
        item={selectedItem}
        columns={columns.filter(c => !c.isArchived)}
        onSave={(data) => saveItemMutation.mutateAsync(data)}
        onArchive={(id, archived) => archiveItemMutation.mutateAsync({ id, archived })}
        onDelete={(id) => deleteItemMutation.mutateAsync(id)}
      />

      <TrackerColumnDialog 
        isOpen={isColumnDialogOpen}
        onClose={() => setIsColumnDialogOpen(false)}
        column={selectedColumn}
        onSave={(data) => saveColumnMutation.mutateAsync(data)}
      />

      <BoardSettingsDialog 
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        board={board}
        onSave={(settings) => updateBoardMutation.mutateAsync(settings)}
      />
    </div>
  );
}

