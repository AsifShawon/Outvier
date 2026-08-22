'use client';

import { formatDistanceToNow } from 'date-fns';
import { CloudOff, Save, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DraftStatusProps {
  /** True when a draft exists in localStorage */
  hasDraft: boolean;
  /** When the draft was last saved */
  draftSavedAt: Date | null;
  /** True while the autosave debounce timer is pending */
  isSaving?: boolean;
  /** Restore the draft into the form */
  onRestore: () => void;
  /** Discard the draft */
  onClear: () => void;
  className?: string;
}

/**
 * A status pill / banner indicating draft state.
 *
 * Shows one of three states:
 * 1. **Draft exists** — "Draft from 5 min ago · Restore · Discard"
 * 2. **Autosave pending** — "Saving…" spinner
 * 3. **Nothing** — renders null
 */
export function DraftStatus({
  hasDraft,
  draftSavedAt,
  isSaving,
  onRestore,
  onClear,
  className,
}: DraftStatusProps) {
  if (!hasDraft && !isSaving) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 px-4 py-2.5 text-sm',
        className
      )}
    >
      {isSaving ? (
        <>
          <Save className="h-3.5 w-3.5 text-muted-foreground animate-pulse shrink-0" />
          <span className="text-muted-foreground text-xs">Saving draft…</span>
        </>
      ) : hasDraft && draftSavedAt ? (
        <>
          <CloudOff className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-muted-foreground text-xs flex-1">
            Draft from{' '}
            <strong className="text-foreground font-medium">
              {formatDistanceToNow(draftSavedAt, { addSuffix: true })}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1 text-primary hover:text-primary"
              onClick={onRestore}
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={onClear}
            >
              Discard
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
