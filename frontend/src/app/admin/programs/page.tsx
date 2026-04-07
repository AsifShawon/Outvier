import { ProgramTable } from '@/components/admin/ProgramTable';

export default function AdminProgramsPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold font-display mb-6">Programs</h1>
      <ProgramTable />
    </div>
  );
}
