import { UniversityTable } from '@/components/admin/UniversityTable';
import { Button } from '@/components/ui/button';
import { Plus, Upload, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function AdminUniversitiesPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Universities</h1>
          <p className="text-sm text-slate-500 mt-1">Manage Australian university profiles, campuses, programs, and source data.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="bg-white">
            <Link href="/admin/cricos">
              <RefreshCw className="h-4 w-4 mr-2" />
              Import/Sync
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="bg-white">
            <Link href="/admin/uploads">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-deep-green hover:bg-deep-green/90">
            <Link href="/admin/universities/new">
              <Plus className="h-4 w-4 mr-2" />
              Add University
            </Link>
          </Button>
        </div>
      </div>
      <UniversityTable />
    </div>
  );
}
