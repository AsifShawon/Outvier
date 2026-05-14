'use client';

import { useEffect, useState, use } from 'react';
import { ScholarshipForm } from '@/components/admin/scholarships/ScholarshipForm';
import { adminScholarshipsApi } from '@/lib/api/scholarships.api';
import { Scholarship } from '@/types/scholarship';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { notFound } from 'next/navigation';

export default function AdminScholarshipEditPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [data, setData] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScholarship = async () => {
      try {
        const res = await adminScholarshipsApi.getScholarship(resolvedParams.id);
        if (res.data.success) {
          setData(res.data.data);
        } else {
          toast.error('Failed to load scholarship');
        }
      } catch (error) {
        toast.error('Scholarship not found or error loading');
      } finally {
        setLoading(false);
      }
    };
    if (resolvedParams.id) {
      fetchScholarship();
    }
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-[600px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data && !loading) {
    return notFound();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-display text-slate-900">Edit Scholarship</h1>
        <p className="text-sm text-slate-500 mt-1">Update information for {data?.title}</p>
      </div>
      <ScholarshipForm initialData={data!} isEdit={true} />
    </div>
  );
}
