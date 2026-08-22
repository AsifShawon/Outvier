'use client';

import { useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';
import { type UseFormDraftReturn } from './useFormDraft';

export interface UseAutosaveOptions {
  /** Draft storage key — same key passed to useFormDraft */
  key: string;
  /** Debounce delay in ms (default: 1500) */
  delay?: number;
  /** Whether autosave is active (default: true) */
  enabled?: boolean;
  /** saveDraft function from useFormDraft */
  saveDraft: UseFormDraftReturn['saveDraft'];
}

export interface UseAutosaveReturn {
  /** Timestamp of most recent autosave */
  lastSavedAt: Date | null;
  /** True while debounce timer is pending (i.e. unsaved changes exist) */
  isSaving: boolean;
}

/**
 * Debounced autosave that watches RHF values and calls saveDraft after idle.
 *
 * Usage:
 * ```tsx
 * const { lastSavedAt } = useAutosave(methods, { key, saveDraft });
 * ```
 */
export function useAutosave<TFieldValues extends FieldValues>(
  methods: UseFormReturn<TFieldValues>,
  options: UseAutosaveOptions
): UseAutosaveReturn {
  const { delay = 1500, enabled = true, saveDraft } = options;
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Subscribe to all form value changes
    const subscription = methods.watch(() => {
      setIsSaving(true);
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        saveDraft();
        setLastSavedAt(new Date());
        setIsSaving(false);
      }, delay);
    });

    return () => {
      subscription.unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [methods, delay, enabled, saveDraft]);

  return { lastSavedAt, isSaving };
}
