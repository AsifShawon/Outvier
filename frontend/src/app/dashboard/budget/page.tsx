'use client';

import { BudgetCalculator } from '@/components/dashboard/BudgetCalculator';
import { Button } from '@/components/ui/button';
import { Settings, Share2, Download } from 'lucide-react';

export default function BudgetPage() {
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900">
            Financial Planner
          </h1>
          <p className="text-slate-500 mt-2">
            Calculate your study abroad costs and visualize your funding strategy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <BudgetCalculator />
    </div>
  );
}
