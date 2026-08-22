import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StickyFormActionsProps {
  /** Label for the primary submit/continue button */
  primaryLabel: string;
  /** Label for the secondary cancel/back button */
  secondaryLabel?: string;
  /** Callback for secondary button */
  onSecondary?: () => void;
  /** Whether the primary action is in a loading state */
  isLoading?: boolean;
  /** Whether to show the Save Draft button */
  showSaveDraft?: boolean;
  /** Callback for Save Draft button */
  onSaveDraft?: () => void;
  /** Whether the primary button should be submit type (default: true) */
  primaryType?: 'submit' | 'button';
  /** Callback for primary button when not a submit */
  onPrimary?: () => void;
  /** Whether the primary button is disabled */
  primaryDisabled?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * Fixed bottom action bar consistent with the existing profile form pattern.
 *
 * Layout:
 * - Left: secondary action (quiet ghost button)
 * - Right: [Save Draft] [Primary action]
 *
 * On mobile the primary button becomes full-width below the bar.
 *
 * ```tsx
 * <StickyFormActions
 *   primaryLabel="Create University"
 *   secondaryLabel="Cancel"
 *   onSecondary={() => router.back()}
 *   isLoading={mutation.isPending}
 *   showSaveDraft
 *   onSaveDraft={draft.saveDraft}
 * />
 * ```
 */
export function StickyFormActions({
  primaryLabel,
  secondaryLabel,
  onSecondary,
  isLoading,
  showSaveDraft,
  onSaveDraft,
  primaryType = 'submit',
  onPrimary,
  primaryDisabled,
  className,
}: StickyFormActionsProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t border-border bg-background/80 backdrop-blur-md',
        'px-4 py-3',
        className
      )}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Secondary / back action */}
        <Button
          type="button"
          variant="ghost"
          onClick={onSecondary}
          disabled={isLoading}
          className="font-medium text-muted-foreground"
        >
          {secondaryLabel ?? 'Cancel'}
        </Button>

        {/* Right-side actions */}
        <div className="flex items-center gap-2">
          {showSaveDraft && onSaveDraft && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSaveDraft}
              disabled={isLoading}
              className="hidden sm:flex font-medium"
            >
              Save Draft
            </Button>
          )}

          <Button
            type={primaryType}
            onClick={onPrimary}
            disabled={isLoading || primaryDisabled}
            className="min-w-32 font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-1.5">Saving…</span>
              </>
            ) : (
              primaryLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
