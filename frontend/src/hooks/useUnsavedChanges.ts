'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import { useRouter } from 'next/navigation';

export interface UseUnsavedChangesReturn {
  /** Whether the dialog should be shown */
  showDialog: boolean;
  /** Confirm the navigation — proceed to pending destination */
  confirmLeave: () => void;
  /** Cancel the navigation — close dialog, stay on page */
  cancelLeave: () => void;
}

/**
 * Warns users when they attempt to navigate away from a dirty form.
 *
 * Two layers of protection:
 * 1. `window.beforeunload` — catches tab close / hard navigation.
 * 2. `showDialog` state — consumed by `UnsavedChangesDialog` for soft navigation.
 *
 * For soft navigation (Next.js Link clicks), wrap your `<Link>` or `<Button>`
 * with a guard that checks `isDirty` before calling `router.push`. The hook
 * exposes `showDialog` / `confirmLeave` / `cancelLeave` to power that dialog.
 *
 * Usage:
 * ```tsx
 * const { showDialog, confirmLeave, cancelLeave } = useUnsavedChanges(methods);
 *
 * const handleBack = () => {
 *   if (methods.formState.isDirty) setShowUnsaved(true);
 *   else router.push('/admin/universities');
 * };
 * ```
 */
export function useUnsavedChanges<TFieldValues extends FieldValues>(
  methods: UseFormReturn<TFieldValues>
): UseUnsavedChangesReturn {
  const [showDialog, setShowDialog] = useState(false);
  const pendingNavRef = useRef<(() => void) | null>(null);

  const isDirty = methods.formState.isDirty;

  // beforeunload — browser-level protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // Legacy support
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /**
   * Call this instead of `router.push(href)` when you want the dialog guard.
   *
   * Example:
   * ```tsx
   * const guardedNavigate = unsaved.guardNavigate;
   * <Button onClick={() => guardedNavigate(() => router.push('/admin'))}>Back</Button>
   * ```
   */
  const guardNavigate = useCallback(
    (navigate: () => void) => {
      if (isDirty) {
        pendingNavRef.current = navigate;
        setShowDialog(true);
      } else {
        navigate();
      }
    },
    [isDirty]
  );

  const confirmLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavRef.current?.();
    pendingNavRef.current = null;
  }, []);

  const cancelLeave = useCallback(() => {
    setShowDialog(false);
    pendingNavRef.current = null;
  }, []);

  return {
    showDialog,
    confirmLeave,
    cancelLeave,
    // @ts-expect-error — extended return
    guardNavigate,
  };
}

// Re-export extended type for consumers
export interface UseUnsavedChangesReturnExtended extends UseUnsavedChangesReturn {
  guardNavigate: (navigate: () => void) => void;
}
