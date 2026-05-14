import { ApplicationKanban } from '@/components/dashboard/ApplicationKanban';
import { Layout } from 'lucide-react';

export default function TrackerPage() {
  return (
    <div className="space-y-6 pb-16">
      {/* Compact page header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            <Layout className="h-3 w-3" />
            <span>Dashboard</span>
            <span className="text-slate-200">/</span>
            <span className="text-primary">Application Tracker</span>
          </div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900">
            My Study Journey
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-0.5">
            Track your applications from research to onboarding.
          </p>
        </div>
      </div>

      {/* Full-width board — negative margins to escape max-w-6xl */}
      <div className="-mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8">
        <ApplicationKanban />
      </div>
    </div>
  );
}
