'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { comparisonApi } from '@/lib/api/comparison.api';
import { toast } from 'sonner';

interface ComparisonContextType {
  hash: string | null;
  selectedIds: string[];
  selectedUniIds: string[];
  addToCompare: (programId: string) => Promise<void>;
  removeFromCompare: (programId: string) => Promise<void>;
  addUniversityToCompare: (universityId: string) => Promise<void>;
  removeUniversityFromCompare: (universityId: string) => Promise<void>;
  isLoading: boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [hash, setHash] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUniIds, setSelectedUniIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      let currentHash = localStorage.getItem('outvier_comparison_hash');
      
      try {
        if (!currentHash) {
          const res = await comparisonApi.createSession();
          currentHash = res.data.data.hash;
          localStorage.setItem('outvier_comparison_hash', currentHash!);
        }
        setHash(currentHash);

        const sessionRes = await comparisonApi.getSession(currentHash!);
        const session = sessionRes.data.data;
        
        const programIds = session.selectedProgramIds.map((p: any) => 
          typeof p === 'object' ? p._id : p
        );
        setSelectedIds(programIds);

        const uniIds = session.selectedUniversityIds?.map((u: any) => 
          typeof u === 'object' ? u._id : u
        ) || [];
        setSelectedUniIds(uniIds);
      } catch (err) {
        console.error('Failed to init comparison session', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();
  }, []);

  const addToCompare = async (programId: string) => {
    if (!hash) return;
    if (selectedIds.includes(programId)) {
      toast.info('Program already in comparison');
      return;
    }
    if (selectedIds.length >= 4) {
      toast.warning('Maximum 4 programs can be compared at once.');
      return;
    }

    try {
      await comparisonApi.addProgram(hash, programId);
      setSelectedIds(prev => [...prev, programId]);
      toast.success('Program added to comparison');
    } catch (err) {
      toast.error('Failed to add program to comparison');
    }
  };

  const removeFromCompare = async (programId: string) => {
    if (!hash) return;
    try {
      await comparisonApi.removeProgram(hash, programId);
      setSelectedIds(prev => prev.filter(id => id !== programId));
      toast.success('Program removed from comparison');
    } catch (err) {
      toast.error('Failed to remove program');
    }
  };

  const addUniversityToCompare = async (universityId: string) => {
    if (!hash) return;
    if (selectedUniIds.includes(universityId)) {
      toast.info('University already in comparison');
      return;
    }
    if (selectedUniIds.length >= 4) {
      toast.warning('Maximum 4 universities can be compared at once.');
      return;
    }

    try {
      // We'll need to add this to comparisonApi
      await (comparisonApi as any).addUniversity(hash, universityId);
      setSelectedUniIds(prev => [...prev, universityId]);
      toast.success('University added to comparison');
    } catch (err) {
      toast.error('Failed to add university to comparison');
    }
  };

  const removeUniversityFromCompare = async (universityId: string) => {
    if (!hash) return;
    try {
      await (comparisonApi as any).removeUniversity(hash, universityId);
      setSelectedUniIds(prev => prev.filter(id => id !== universityId));
      toast.success('University removed from comparison');
    } catch (err) {
      toast.error('Failed to remove university');
    }
  };

  return (
    <ComparisonContext.Provider value={{ 
      hash, 
      selectedIds, 
      selectedUniIds, 
      addToCompare, 
      removeFromCompare,
      addUniversityToCompare,
      removeUniversityFromCompare,
      isLoading 
    }}>
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
