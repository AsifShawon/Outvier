import { ScholarshipTable } from '@/components/admin/scholarships/ScholarshipTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function AdminScholarshipsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Scholarships</h1>
          <p className="text-sm text-slate-500 mt-1">Manage scholarships, grants, events, and other study scholarships.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button size="sm" asChild className="bg-deep-green hover:bg-deep-green/90">
            <Link href="/admin/scholarships/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Scholarship
            </Link>
          </Button>
        </div>
      </div>
      <ScholarshipTable />
    </div>
  );
}
