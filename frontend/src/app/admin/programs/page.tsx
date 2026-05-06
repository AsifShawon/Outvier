import { ProgramTable } from '@/components/admin/ProgramTable';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import Link from 'next/link';

export default function AdminProgramsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display text-slate-900">Programs</h1>
          <p className="text-sm text-slate-500 mt-1">Manage degrees, fees, intakes, requirements, and career outcomes.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild className="bg-white">
            <Link href="/admin/uploads">
              <Download className="h-4 w-4 mr-2" />
              Import Data
            </Link>
          </Button>
          <Button size="sm" asChild className="bg-deep-green hover:bg-deep-green/90">
            <Link href="/admin/programs/new">
              <Plus className="h-4 w-4 mr-2" />
              Add Program
            </Link>
          </Button>
        </div>
      </div>
      <ProgramTable />
    </div>
  );
}
