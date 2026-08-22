'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type FieldValues, type UseFormReturn } from 'react-hook-form';

const STORAGE_PREFIX = 'outvier:draft:';

export interface UseFormDraftReturn {
  /** True when a saved draft exists in localStorage for this key */
  hasDraft: boolean;
  /** When the draft was last written */
  draftSavedAt: Date | null;
  /** Manually persist current form values to localStorage */
  saveDraft: () => void;
  /** Remove the draft from localStorage */
  clearDraft: () => void;
  /** Restore saved draft values into the form */
  restoreDraft: () => void;
}

/**
 * Manages draft persistence for a React Hook Form instance.
 *
 * Usage:
 * ```tsx
 * const draft = useFormDraft('university-new', methods);
 * ```
 *
 * Drafts are stored in localStorage under the key `outvier:draft:<key>`.
 * When a draft exists on mount, `hasDraft` is true. Call `restoreDraft()`
 * to populate the form, or `clearDraft()` to discard.
 */
export function useFormDraft<TFieldValues extends FieldValues>(
  key: string,
  methods: UseFormReturn<TFieldValues>
): UseFormDraftReturn {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null);

  // Check for existing draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { values: TFieldValues; savedAt: string };
        if (parsed?.values) {
          setHasDraft(true);
          setDraftSavedAt(new Date(parsed.savedAt));
        }
      }
    } catch {
      // Corrupted draft — ignore
      localStorage.removeItem(storageKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const saveDraft = useCallback(() => {
    try {
      const values = methods.getValues();
      const savedAt = new Date().toISOString();
      localStorage.setItem(storageKey, JSON.stringify({ values, savedAt }));
      setHasDraft(true);
      setDraftSavedAt(new Date(savedAt));
    } catch {
      // localStorage may be unavailable (SSR, private mode)
    }
  }, [methods, storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftSavedAt(null);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { values: TFieldValues; savedAt: string };
      if (parsed?.values) {
        methods.reset(parsed.values, { keepDefaultValues: false });
        setHasDraft(false);
        setDraftSavedAt(null);
      }
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [methods, storageKey]);

  return { hasDraft, draftSavedAt, saveDraft, clearDraft, restoreDraft };
}
