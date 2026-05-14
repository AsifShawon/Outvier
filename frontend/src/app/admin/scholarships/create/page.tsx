import { ScholarshipForm } from '@/components/admin/scholarships/ScholarshipForm';

export default function AdminScholarshipCreatePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-display text-slate-900">Create Scholarship</h1>
        <p className="text-sm text-slate-500 mt-1">Add a new scholarship, grant, event, or support program.</p>
      </div>
      <ScholarshipForm />
    </div>
  );
}
