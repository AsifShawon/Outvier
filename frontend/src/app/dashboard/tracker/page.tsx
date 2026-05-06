'use client';

import { ApplicationKanban } from '@/components/dashboard/ApplicationKanban';
import { Button } from '@/components/ui/button';
import { Plus, Settings, Filter } from 'lucide-react';
import Link from 'next/link';

export default function TrackerPage() {
  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900">
            Application Tracker
          </h1>
          <p className="text-slate-500 mt-2">
            Monitor your university applications from shortlist to enrollment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="rounded-xl border-slate-200 bg-white">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button size="sm" asChild className="rounded-xl bg-deep-green hover:bg-deep-green/90 shadow-md">
            <Link href="/dashboard/saved">
              <Plus className="h-4 w-4 mr-2" />
              Add Tracker Item
            </Link>
          </Button>
        </div>
      </div>

      <ApplicationKanban />
    </div>
  );
}
