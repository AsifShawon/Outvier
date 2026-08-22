'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { UniversityForm } from '@/components/admin/university/UniversityForm';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';

export default function EditUniversityPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['university-edit', id],
    queryFn: () => universitiesApi.adminGetAll({ limit: 200 }),
    select: (res) => {
      const unis: University[] = res.data.data ?? [];
      return unis.find((u) => u._id === id);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <UniversityForm mode="edit" defaultData={data} universityId={id} />
  );
}
