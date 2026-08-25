'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface SavedSearch {
  id: string;
  name: string;
  type: 'programs' | 'universities';
  params: Record<string, string>;
  createdAt: string;
}

export function useSavedSearches(type: 'programs' | 'universities') {
  const storageKey = `outvier_saved_${type}_searches`;
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSavedSearches(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, [storageKey]);

  const saveSearch = (name: string, params: Record<string, string>) => {
    if (!name.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    const cleanParams: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v && v !== 'all' && k !== 'page') {
        cleanParams[k] = v;
      }
    });

    if (Object.keys(cleanParams).length === 0) {
      toast.info('No active filters to save');
      return;
    }

    const newSearch: SavedSearch = {
      id: `search_${Date.now()}`,
      name: name.trim(),
      type,
      params: cleanParams,
      createdAt: new Date().toISOString(),
    };

    const updated = [newSearch, ...savedSearches.slice(0, 9)];
    setSavedSearches(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      toast.success(`Saved search "${name}" created! 🔍`);
    } catch {
      toast.error('Failed to save search preset');
    }
  };

  const removeSearch = (id: string) => {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
      toast.success('Saved search removed');
    } catch {
      toast.error('Failed to remove saved search');
    }
  };

  return {
    savedSearches,
    saveSearch,
    removeSearch,
  };
}
