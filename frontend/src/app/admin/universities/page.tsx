import { UniversityTable } from '@/components/admin/UniversityTable';

export default function AdminUniversitiesPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold font-display mb-6">Universities</h1>
      <UniversityTable />
    </div>
  );
}
