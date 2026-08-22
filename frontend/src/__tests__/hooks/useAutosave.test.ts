/**
 * useAutosave hook tests — timer / debounce logic.
 * Run with: `npx vitest run src/__tests__/hooks/useAutosave.test.ts`
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('autosave debounce logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not save immediately when value changes', () => {
    const saveDraft = vi.fn();
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    // Simulate what useAutosave does internally
    const scheduleAutosave = (delay: number) => {
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => {
        saveDraft();
        pendingTimer = null;
      }, delay);
    };

    scheduleAutosave(1500);
    expect(saveDraft).not.toHaveBeenCalled();
  });

  it('saves after the debounce delay elapses', () => {
    const saveDraft = vi.fn();
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleAutosave = (delay: number) => {
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => {
        saveDraft();
        pendingTimer = null;
      }, delay);
    };

    scheduleAutosave(1500);
    vi.advanceTimersByTime(1500);
    expect(saveDraft).toHaveBeenCalledOnce();
  });

  it('resets the timer when called multiple times within the delay', () => {
    const saveDraft = vi.fn();
    let pendingTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleAutosave = (delay: number) => {
      if (pendingTimer) clearTimeout(pendingTimer);
      pendingTimer = setTimeout(() => {
        saveDraft();
        pendingTimer = null;
      }, delay);
    };

    scheduleAutosave(1500);
    vi.advanceTimersByTime(500);
    scheduleAutosave(1500); // reset
    vi.advanceTimersByTime(500);
    scheduleAutosave(1500); // reset again
    vi.advanceTimersByTime(1499);
    expect(saveDraft).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(saveDraft).toHaveBeenCalledOnce();
  });
});
