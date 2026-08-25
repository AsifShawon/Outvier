'use client';

import { useComparison } from '@/context/ComparisonContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Scale, X, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { programsApi } from '@/lib/api/programs.api';
import { universitiesApi } from '@/lib/api/universities.api';
import { Program } from '@/types/program';
import { University } from '@/types/university';

export function ComparisonTray() {
  const { selectedIds, selectedUniIds, removeFromCompare, removeUniversityFromCompare } = useComparison();

  const totalSelected = selectedIds.length + selectedUniIds.length;

  // Fetch program titles if any selected
  const { data: programsRes } = useQuery({
    queryKey: ['tray-programs', selectedIds],
    queryFn: async () => {
      if (selectedIds.length === 0) return [];
      const res = await programsApi.getAll({ limit: 10 });
      return ((res.data as any).programs as Program[]).filter((p: Program) => selectedIds.includes(p._id));
    },
    enabled: selectedIds.length > 0,
  });

  const { data: unisRes } = useQuery({
    queryKey: ['tray-unis', selectedUniIds],
    queryFn: async () => {
      if (selectedUniIds.length === 0) return [];
      const res = await universitiesApi.getAll({ limit: 10 });
      return ((res.data as any).universities as University[]).filter((u: University) => selectedUniIds.includes(u._id));
    },
    enabled: selectedUniIds.length > 0,
  });

  const programs: Program[] = programsRes || [];
  const universities: University[] = unisRes || [];

  if (totalSelected === 0) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none flex justify-center animate-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-card/95 backdrop-blur-md border border-border p-3 sm:p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Indicator & Selected Item Chips */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Scale className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-foreground">
                Comparison Workspace
              </span>
              <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20">
                {totalSelected} / 4 Selected
              </Badge>
            </div>

            {/* Selected Chips */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-0.5 max-w-[400px]">
              {selectedIds.map((id) => {
                const prog = programs.find((p: Program) => p._id === id);
                const title = prog ? prog.name : 'Selected Program';
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-lg text-[10px] font-medium text-foreground shrink-0 max-w-[140px]"
                  >
                    <span className="truncate">{title}</span>
                    <button
                      onClick={() => removeFromCompare(id)}
                      className="text-muted-foreground hover:text-destructive ml-0.5"
                      title="Remove"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}

              {selectedUniIds.map((id) => {
                const uni = universities.find((u: University) => u._id === id);
                const title = uni ? uni.name : 'Selected University';
                return (
                  <div
                    key={id}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-[10px] font-medium shrink-0 max-w-[140px]"
                  >
                    <span className="truncate">{title}</span>
                    <button
                      onClick={() => removeUniversityFromCompare(id)}
                      className="text-primary hover:text-destructive ml-0.5"
                      title="Remove"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Compare Action CTA */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <Link href="/compare">
            <Button size="sm" className="text-xs font-bold gap-1.5 h-9 rounded-xl shadow-xs">
              <span>Compare Choices</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
