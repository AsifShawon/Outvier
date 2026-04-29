'use client';

import Link from 'next/link';
import { useComparison } from '@/context/ComparisonContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart2, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CompareBar() {
  const { selectedIds, hash, removeFromCompare } = useComparison();

  if (selectedIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
      >
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Compare Programs</p>
              <p className="text-xs text-slate-400">{selectedIds.length} programs selected</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href={`/compare/${hash}`}>
              <Button className="bg-primary hover:bg-primary/90 text-white gap-2 rounded-xl h-10 px-6">
                Compare Now <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
