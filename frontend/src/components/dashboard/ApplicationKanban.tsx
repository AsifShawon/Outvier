'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  applicationTrackerApi,
  ApplicationTrackerItem,
  TrackerColumn as ITrackerColumn,
} from '@/lib/api/applicationTracker.api';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { TrackerColumn } from './TrackerColumn';
import { TrackerCard } from './TrackerCard';
import { AddApplicationWizard } from './AddApplicationWizard';
import { ApplicationDetailsDrawer } from './ApplicationDetailsDrawer';
import { TrackerColumnDialog } from './TrackerColumnDialog';
import { BoardSettingsDialog } from './BoardSettingsDialog';
import { TrackerFilters } from './TrackerFilters';
import { TrackerSummaryBar } from './TrackerSummaryBar';
import { MobileTrackerView } from './MobileTrackerView';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Settings2, Loader2, Sliders, GraduationCap, Rocket, Archive, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ApplicationKanbanProps {
  onSelectApplication?: (id: string) => void;
  onOpenWizard?: () => void;
}

export function ApplicationKanban({ onSelectApplication, onOpenWizard }: ApplicationKanbanProps = {}) {
  const qc = useQueryClient();

  // UI State
  const [filters, setFilters] = useState<any>({ archived: 'false' });
  const [showArchived, setShowArchived] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApplicationTrackerItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardColumnId, setWizardColumnId] = useState<string | undefined>(undefined);
  const [selectedColumn, setSelectedColumn] = useState<Partial<ITrackerColumn> | null>(null);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // DnD state
  const [activeItem, setActiveItem] = useState<ApplicationTrackerItem | null>(null);
  const [localItems, setLocalItems] = useState<ApplicationTrackerItem[] | null>(null);

  // Build effective filters (merge showArchived into filters)
  const effectiveFilters = { ...filters, archived: showArchived ? 'true' : 'false' };

  // Queries
  const { data: boardRes, isLoading: isLoadingBoard } = useQuery({
    queryKey: ['tracker-board'],
    queryFn: () => applicationTrackerApi.getBoard(),
  });

  const { data: itemsRes, isLoading: isLoadingItems } = useQuery({
    queryKey: ['tracker-items', effectiveFilters],
    queryFn: () => applicationTrackerApi.getItems(effectiveFilters),
  });

  // Also fetch all items (unfiltered) for the summary bar counts
  const { data: allItemsRes } = useQuery({
    queryKey: ['tracker-items-all'],
    queryFn: () => applicationTrackerApi.getItems({}),
  });

  const board = boardRes?.data?.data;
  const items = localItems ?? (itemsRes?.data?.data || []);
  const allItems = allItemsRes?.data?.data || [];
  const columns = (board?.columns || []).filter(c => !c.isArchived).sort((a, b) => a.order - b.order);
  const archivedCount = allItems.filter(i => i.archived).length;

  // DnD Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  );

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (data: any) => applicationTrackerApi.createItem(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      qc.invalidateQueries({ queryKey: ['tracker-items-all'] });
      toast.success('Application added! 🎉');
    },
    onError: () => toast.error('Failed to create application'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => applicationTrackerApi.updateItem(id, data),
    onSuccess: res => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      qc.invalidateQueries({ queryKey: ['tracker-items-all'] });
      if (selectedItem) setSelectedItem(res.data.data);
    },
    onError: () => toast.error('Failed to update'),
  });

  const moveItemMutation = useMutation({
    mutationFn: ({ id, toColumnId }: { id: string; toColumnId: string }) =>
      applicationTrackerApi.moveItem(id, toColumnId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      qc.invalidateQueries({ queryKey: ['tracker-items-all'] });
      const colName = columns.find(c => c.id === vars.toColumnId)?.title;
      toast.success(`Moved to ${colName}`);
      setLocalItems(null);
      if (selectedItem?._id === vars.id) {
        setSelectedItem(prev => prev ? { ...prev, columnId: vars.toColumnId } : prev);
      }
    },
    onError: () => { setLocalItems(null); toast.error('Move failed — reverted'); },
  });

  const archiveItemMutation = useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      applicationTrackerApi.archiveItem(id, archived),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      qc.invalidateQueries({ queryKey: ['tracker-items-all'] });
      toast.success(vars.archived ? 'Archived' : 'Restored');
      if (isDrawerOpen) setIsDrawerOpen(false);
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => applicationTrackerApi.deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-items'] });
      qc.invalidateQueries({ queryKey: ['tracker-items-all'] });
      toast.success('Application removed');
      setIsDrawerOpen(false);
    },
  });

  const updateBoardMutation = useMutation({
    mutationFn: (settings: any) => applicationTrackerApi.updateBoard({ settings }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracker-board'] });
      toast.success('Board settings saved');
    },
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
    },
  });

  const archiveColumnMutation = useMutation({
    mutationFn: (id: string) => applicationTrackerApi.updateColumn(id, { isArchived: true }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tracker-board'] }); toast.success('Column hidden'); },
  });

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragged = items.find(i => i._id === event.active.id);
    if (dragged) setActiveItem(dragged);
  }, [items]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const overIsColumn = columns.some(c => c.id === overId);
    const overItem = items.find(i => i._id === overId);
    const targetColumnId = overIsColumn ? overId : overItem?.columnId;
    if (!targetColumnId) return;
    const base = itemsRes?.data?.data || [];
    setLocalItems(prev => (prev ?? base).map(i => i._id === activeId ? { ...i, columnId: targetColumnId } : i));
  }, [columns, items, itemsRes]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    if (!over) { setLocalItems(null); return; }
    const activeId = active.id as string;
    const overId = over.id as string;
    const dragged = items.find(i => i._id === activeId);
    if (!dragged) { setLocalItems(null); return; }
    const overIsColumn = columns.some(c => c.id === overId);
    const overItem = items.find(i => i._id === overId);
    const targetColumnId = overIsColumn ? overId : overItem?.columnId;
    if (!targetColumnId || targetColumnId === dragged.columnId) { setLocalItems(null); return; }
    moveItemMutation.mutate({ id: activeId, toColumnId: targetColumnId });
  }, [items, columns, moveItemMutation]);

  // UI handlers
  const handleAddItem = (columnId?: string) => {
    setWizardColumnId(columnId);
    setIsWizardOpen(true);
  };

  const handleOpenCard = (item: ApplicationTrackerItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleQuickArchive = useCallback((item: ApplicationTrackerItem) => {
    archiveItemMutation.mutate({ id: item._id, archived: !item.archived });
  }, [archiveItemMutation]);

  const handleQuickMove = useCallback((id: string, toColumnId: string) => {
    moveItemMutation.mutate({ id, toColumnId });
  }, [moveItemMutation]);

  const activeItems = allItems.filter(i => !i.archived);
  const hasNoActiveItems = activeItems.length === 0 && !isLoadingItems;
  const hasFilters = !!(filters.search || filters.priority || filters.itemType || filters.country);

  if (isLoadingBoard) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading board...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* === Top toolbar === */}
      <div className="flex flex-col gap-3">
        {/* Summary + Actions row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TrackerSummaryBar
            items={allItems}
            onFilterChange={f => { setFilters({ ...filters, ...f }); setShowArchived(false); }}
          />
          <div className="flex items-center gap-2 shrink-0">
            {/* Archive toggle */}
            <button
              onClick={() => setShowArchived(v => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-10 rounded-xl border text-sm font-bold transition-all',
                showArchived
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 bg-white'
              )}
            >
              <Archive className="h-4 w-4" />
              <span className="hidden sm:inline">{showArchived ? 'Archived' : 'Archived'}</span>
              {archivedCount > 0 && (
                <Badge className={cn(
                  'h-4 min-w-[16px] px-1 text-[9px] font-black rounded-full',
                  showArchived ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}>
                  {archivedCount}
                </Badge>
              )}
            </button>

            <Button
              onClick={() => { setSelectedColumn(null); setIsColumnDialogOpen(true); }}
              variant="outline"
              className="rounded-xl border-slate-200 h-10 px-3 font-bold text-slate-500 hover:text-primary hover:border-primary/50 gap-2 text-sm bg-white"
            >
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Columns</span>
            </Button>

            <Button
              onClick={() => handleAddItem()}
              className="rounded-xl bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-white shadow-md shadow-primary/15 gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Application</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <TrackerFilters
          filters={filters}
          onFilterChange={f => { setFilters(f); setShowArchived(false); }}
          onClear={() => { setFilters({ archived: 'false' }); setShowArchived(false); }}
        />

        {/* Archived banner */}
        {showArchived && (
          <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-xl">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold">Showing {archivedCount} archived application{archivedCount !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={() => setShowArchived(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* === Empty state (only when no active items AND no filters active) === */}
      {hasNoActiveItems && !showArchived && !hasFilters && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-6 text-center bg-gradient-to-b from-slate-50 to-white rounded-3xl border-2 border-dashed border-slate-200"
        >
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
            <Rocket className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-1">Start tracking your study journey</h3>
          <p className="text-slate-400 font-medium mb-6 max-w-sm text-sm">
            Add your first application and drag it through the stages as your journey progresses.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleAddItem()}
              className="rounded-xl bg-primary hover:bg-primary/90 h-11 px-7 font-bold text-white shadow-lg shadow-primary/20 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Application
            </Button>
            <Button variant="outline" className="rounded-xl border-slate-200 h-11 px-7 font-bold text-slate-600 hover:border-primary/40 hover:text-primary gap-2" asChild>
              <a href="/dashboard/saved">
                <GraduationCap className="h-4 w-4" />
                From Saved Items
              </a>
            </Button>
          </div>
        </motion.div>
      )}

      {/* === Mobile View === */}
      <div className="lg:hidden">
        <MobileTrackerView
          columns={columns}
          items={items}
          onAddItem={handleAddItem}
          onEditItem={handleOpenCard}
          onMoveItem={async (id, toColumnId) => { await moveItemMutation.mutateAsync({ id, toColumnId }); }}
          onArchiveItem={handleQuickArchive}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(v => !v)}
          archivedCount={archivedCount}
        />
      </div>

      {/* === Desktop Kanban Board — always show columns === */}
      <div className="hidden lg:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto pb-6" style={{ scrollbarWidth: 'thin' }}>
            <div className="flex gap-3.5 min-w-max pb-2 pt-0.5">
              {columns.map((column, idx) => (
                <TrackerColumn
                  key={column.id}
                  column={column}
                  items={items.filter(i => i.columnId === column.id)}
                  nextColumn={columns[idx + 1]}
                  onAddItem={handleAddItem}
                  onEditItem={handleOpenCard}
                  onMoveItem={handleQuickMove}
                  onArchiveItem={handleQuickArchive}
                  onEditColumn={col => { setSelectedColumn(col); setIsColumnDialogOpen(true); }}
                  onArchiveColumn={id => archiveColumnMutation.mutate(id)}
                />
              ))}

              {/* Add column */}
              <button
                onClick={() => { setSelectedColumn(null); setIsColumnDialogOpen(true); }}
                className="w-[180px] shrink-0 h-28 rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 group self-start"
              >
                <div className="h-7 w-7 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-3.5 w-3.5 text-slate-400 group-hover:text-primary" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-primary">Add Stage</p>
              </button>
            </div>
          </div>

          <DragOverlay>
            {activeItem && (
              <div className="rotate-1 opacity-90 pointer-events-none w-[272px]">
                <TrackerCard item={activeItem} onClick={() => {}} disabled />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* === Modals === */}
      <AddApplicationWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        columns={columns}
        defaultColumnId={wizardColumnId}
        onSave={async data => { await createItemMutation.mutateAsync(data); setIsWizardOpen(false); }}
      />

      <ApplicationDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        item={selectedItem}
        columns={columns}
        onSave={async data => {
          if (selectedItem) await updateItemMutation.mutateAsync({ id: selectedItem._id, data });
        }}
        onArchive={async (id, archived) => { await archiveItemMutation.mutateAsync({ id, archived }); }}
        onDelete={async id => { await deleteItemMutation.mutateAsync(id); }}
        onMove={async (id, columnId) => { await moveItemMutation.mutateAsync({ id, toColumnId: columnId }); }}
        onOpenWorkspace={onSelectApplication}
      />

      <TrackerColumnDialog
        isOpen={isColumnDialogOpen}
        onClose={() => setIsColumnDialogOpen(false)}
        column={selectedColumn}
        onSave={async data => { await saveColumnMutation.mutateAsync(data); }}
      />

      <BoardSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        board={board || null}
        onSave={async settings => { await updateBoardMutation.mutateAsync(settings); }}
      />

      {/* Mobile floating add button */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={() => handleAddItem()}
          className="h-14 w-14 rounded-2xl bg-primary shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:bg-primary/90 active:scale-95 transition-all"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
