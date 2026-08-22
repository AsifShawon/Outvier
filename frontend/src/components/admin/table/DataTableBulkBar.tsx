'use client';

import * as React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';

export interface BulkAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary';
  isDestructive?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  onExecute: (selectedIds: string[]) => Promise<void> | void;
}

interface DataTableBulkBarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  actions: BulkAction[];
  isPending?: boolean;
}

export function DataTableBulkBar({
  selectedIds,
  onClearSelection,
  actions,
  isPending = false,
}: DataTableBulkBarProps) {
  const [activeAction, setActiveAction] = React.useState<BulkAction | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isExecuting, setIsExecuting] = React.useState(false);

  if (selectedIds.length === 0) return null;

  const handleActionClick = (action: BulkAction) => {
    if (action.isDestructive || action.confirmTitle) {
      setActiveAction(action);
      setIsConfirmOpen(true);
    } else {
      action.onExecute(selectedIds);
    }
  };

  const handleConfirm = async () => {
    if (!activeAction) return;
    try {
      setIsExecuting(true);
      await activeAction.onExecute(selectedIds);
      setIsConfirmOpen(false);
      onClearSelection();
    } catch (err) {
      console.error(err);
    } finally {
      setIsExecuting(false);
      setActiveAction(null);
    }
  };

  return (
    <>
      <div className="bg-purple-500/10 dark:bg-[#1e1b4b]/80 border border-purple-500/30 rounded-2xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center gap-2.5">
          <Badge className="bg-purple-500 text-white font-bold px-2 py-0.5 rounded-lg text-xs">
            {selectedIds.length}
          </Badge>
          <span className="text-xs font-semibold text-foreground">
            item{selectedIds.length === 1 ? '' : 's'} selected
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {actions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Button
                key={idx}
                size="sm"
                variant={action.variant || (action.isDestructive ? 'destructive' : 'outline')}
                onClick={() => handleActionClick(action)}
                disabled={isExecuting || isPending}
                className="h-8 text-xs font-semibold rounded-xl"
              >
                {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
                <span>{action.label}</span>
              </Button>
            );
          })}

          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isExecuting || isPending}
            className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Deselect
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Destructive Bulk Operations */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md bg-card dark:bg-slate-900 border-border dark:border-slate-800 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold font-display text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              {activeAction?.confirmTitle || `Confirm Bulk ${activeAction?.label}`}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              {activeAction?.confirmDescription ||
                `Are you sure you want to execute this action on ${selectedIds.length} selected record(s)?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isExecuting}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant={activeAction?.isDestructive ? 'destructive' : 'default'}
              size="sm"
              onClick={handleConfirm}
              disabled={isExecuting}
              className="text-xs font-semibold rounded-xl"
            >
              {isExecuting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              <span>{activeAction?.label || 'Confirm'}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
