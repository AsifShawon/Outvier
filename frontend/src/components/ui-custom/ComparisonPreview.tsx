import { Check, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function ComparisonPreview() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-8 lg:p-12">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h3 className="text-3xl font-bold font-display text-slate-900 dark:text-white mb-4">
          Compare Before You Apply
        </h3>
        <p className="text-slate-500 dark:text-slate-400">
          Make confident decisions by comparing universities and programs side-by-side. Look at tuition, rankings, and career outcomes.
        </p>
      </div>

      <div className="overflow-x-auto pb-4">
        <div className="min-w-[800px] grid grid-cols-4 gap-4">
          {/* Feature Column */}
          <div className="space-y-4 pt-16">
            <div className="h-12 flex items-center px-4 font-medium text-slate-500 dark:text-slate-400">Global Ranking</div>
            <div className="h-12 flex items-center px-4 font-medium text-slate-500 dark:text-slate-400">Tuition Fee/Year</div>
            <div className="h-12 flex items-center px-4 font-medium text-slate-500 dark:text-slate-400">Intake Months</div>
            <div className="h-12 flex items-center px-4 font-medium text-slate-500 dark:text-slate-400">Scholarship</div>
          </div>

          {/* Uni 1 */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">Best Match</div>
            <div className="h-12 flex items-center justify-center font-bold text-slate-900 dark:text-white mb-4">University of Sydney</div>
            <div className="space-y-4 text-center">
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Top 20</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">$45,000</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Feb, Jul</div>
              <div className="h-12 flex items-center justify-center text-green-500"><Check className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Uni 2 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
            <div className="h-12 flex items-center justify-center font-bold text-slate-900 dark:text-white mb-4">Monash University</div>
            <div className="space-y-4 text-center">
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Top 50</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">$42,000</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Feb, Jul, Oct</div>
              <div className="h-12 flex items-center justify-center text-green-500"><Check className="w-5 h-5" /></div>
            </div>
          </div>

          {/* Uni 3 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 opacity-70">
            <div className="h-12 flex items-center justify-center font-bold text-slate-900 dark:text-white mb-4">RMIT University</div>
            <div className="space-y-4 text-center">
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Top 150</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">$38,000</div>
              <div className="h-12 flex items-center justify-center font-semibold text-slate-700 dark:text-slate-300">Feb, Jul</div>
              <div className="h-12 flex items-center justify-center text-slate-300 dark:text-slate-600"><X className="w-5 h-5" /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link href="/programs">
          <Button variant="outline" className="rounded-full px-8 border-slate-300 dark:border-slate-700">
            Try Comparison Tool <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
