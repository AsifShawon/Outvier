'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, DollarSign, Home, HeartPulse, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BudgetPreviewSection() {
  const [level, setLevel] = useState<'bachelor' | 'master'>('bachelor');

  const costs = {
    bachelor: { tuition: 35000, living: 24000, housing: 15000, other: 3000 },
    master: { tuition: 42000, living: 24000, housing: 18000, other: 3000 }
  };

  const currentCost = costs[level];
  const total = Object.values(currentCost).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col lg:flex-row">
      {/* Left side: Calculator logic */}
      <div className="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium text-sm mb-6 w-fit">
          <Calculator className="w-4 h-4" />
          Cost Estimator
        </div>
        <h3 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-4">
          Plan Your Budget
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Get a realistic estimate of your yearly expenses, including tuition, accommodation, and living costs in Australia.
        </p>

        <div className="flex bg-slate-200 dark:bg-slate-800 rounded-xl p-1 mb-8">
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${level === 'bachelor' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            onClick={() => setLevel('bachelor')}
          >
            Bachelor Degree
          </button>
          <button 
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${level === 'master' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
            onClick={() => setLevel('master')}
          >
            Master Degree
          </button>
        </div>

        <Button size="lg" className="rounded-full w-full sm:w-auto h-12 text-base shadow-lg shadow-blue-500/25 bg-blue-600 hover:bg-blue-700 text-white">
          Try Full Calculator
        </Button>
      </div>

      {/* Right side: Visualization */}
      <div className="p-8 lg:p-12 lg:w-1/2 bg-white dark:bg-slate-900 flex flex-col justify-center relative">
        <div className="text-center mb-8">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Estimated Yearly Total</p>
          <motion.div 
            key={total}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-5xl font-display font-bold text-blue-600 dark:text-blue-400"
          >
            ${total.toLocaleString()} <span className="text-2xl text-slate-400 font-medium">AUD</span>
          </motion.div>
        </div>

        <div className="space-y-4">
          <CostItem icon={GraduationCap} label="Tuition Fees" amount={currentCost.tuition} total={total} color="bg-blue-500" />
          <CostItem icon={Home} label="Accommodation" amount={currentCost.housing} total={total} color="bg-indigo-500" />
          <CostItem icon={DollarSign} label="Living Expenses" amount={currentCost.living} total={total} color="bg-emerald-500" />
          <CostItem icon={HeartPulse} label="Insurance & Other" amount={currentCost.other} total={total} color="bg-amber-500" />
        </div>
      </div>
    </div>
  );
}

function CostItem({ icon: Icon, label, amount, total, color }: { icon: React.ElementType, label: string, amount: number, total: number, color: string }) {
  const percentage = (amount / total) * 100;
  
  return (
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex-shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">${amount.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, type: 'spring' }}
            className={`h-full rounded-full ${color}`}
          />
        </div>
      </div>
    </div>
  );
}
