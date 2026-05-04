'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

const steps = [
  { id: 'country', label: 'Destination Country', options: [{ value: 'australia', label: 'Australia' }] }, // Hardcoded to Australia for now as per project context
  { id: 'level', label: 'Study Level', options: [
      { value: 'bachelor', label: 'Bachelor' },
      { value: 'master', label: 'Master' },
      { value: 'phd', label: 'PhD' },
      { value: 'diploma', label: 'Diploma' }
  ] },
  { id: 'field', label: 'Field of Study', options: [
      { value: 'it', label: 'Information Technology' },
      { value: 'business', label: 'Business & Management' },
      { value: 'engineering', label: 'Engineering' },
      { value: 'health', label: 'Health & Medicine' },
      { value: 'arts', label: 'Arts & Humanities' }
  ] },
  { id: 'budget', label: 'Budget Range (Yearly)', options: [
      { value: 'under-20k', label: 'Under $20,000' },
      { value: '20k-30k', label: '$20,000 - $30,000' },
      { value: '30k-40k', label: '$30,000 - $40,000' },
      { value: 'over-40k', label: 'Over $40,000' }
  ] }
];

export function HeroSearchWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSelect = (value: string) => {
    const stepId = steps[currentStep].id;
    setSelections({ ...selections, [stepId]: value });
    
    if (currentStep < steps.length - 1) {
      setTimeout(() => setCurrentStep(currentStep + 1), 300);
    }
  };

  const handleSubmit = () => {
    // Map selected values to query params for /programs
    const params = new URLSearchParams();
    if (selections.level) params.set('level', selections.level);
    // Add other mapped fields as appropriate based on backend support
    // For search text, maybe we map field to search?
    if (selections.field) params.set('search', selections.field);
    
    router.push(`/programs?${params.toString()}`);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl mx-auto relative z-20">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Find Your Match</h3>
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {currentStep < steps.length ? (
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                {steps[currentStep].label}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {steps[currentStep].options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex justify-between items-center ${
                      selections[steps[currentStep].id] === opt.value
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-2 ring-blue-600/20'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                    {selections[steps[currentStep].id] === opt.value && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profile Complete!</h4>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
                We&apos;ve found programs matching your preferences.
              </p>
              <Button 
                onClick={handleSubmit}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/20"
              >
                Find My Best Options <Search className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Completed Steps Pills */}
      {currentStep > 0 && currentStep < steps.length && (
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {steps.slice(0, currentStep).map((step) => {
            const val = selections[step.id];
            const opt = step.options.find(o => o.value === val);
            if (!opt) return null;
            return (
              <div key={step.id} className="inline-flex items-center bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setCurrentStep(steps.findIndex(s => s.id === step.id))}>
                <span className="opacity-70 mr-1">{step.label}:</span>
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
