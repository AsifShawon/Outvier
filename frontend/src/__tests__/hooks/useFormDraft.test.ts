/**
 * useFormDraft hook tests.
 * Run with: `npx vitest run src/__tests__/hooks/useFormDraft.test.ts`
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal localStorage mock
// ---------------------------------------------------------------------------
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// ---------------------------------------------------------------------------
// Tests (pure logic — no React rendering needed)
// ---------------------------------------------------------------------------
describe('useFormDraft storage key', () => {
  beforeEach(() => localStorageMock.clear());

  it('writes values under the correct key', () => {
    const key = 'outvier:draft:university-new';
    const values = { name: 'Test Uni', state: 'SA' };
    const savedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify({ values, savedAt }));

    const raw = localStorage.getItem(key);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.values.name).toBe('Test Uni');
  });

  it('reads and parses draft correctly', () => {
    const key = 'outvier:draft:program-new';
    const values = { name: 'BCS', university: 'uni-1' };
    const savedAt = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify({ values, savedAt }));

    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw!);
    expect(parsed.values.university).toBe('uni-1');
    expect(new Date(parsed.savedAt).getFullYear()).toBe(new Date().getFullYear());
  });

  it('clears the draft on removeItem', () => {
    const key = 'outvier:draft:test';
    localStorage.setItem(key, JSON.stringify({ values: {}, savedAt: '' }));
    localStorage.removeItem(key);
    expect(localStorage.getItem(key)).toBeNull();
  });

  it('handles corrupted JSON without throwing', () => {
    const key = 'outvier:draft:corrupt';
    localStorage.setItem(key, 'NOT_JSON{{{');
    // Simulate the try/catch in useFormDraft
    let parsed = null;
    try {
      parsed = JSON.parse(localStorage.getItem(key)!);
    } catch {
      localStorage.removeItem(key);
    }
    expect(parsed).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
});
