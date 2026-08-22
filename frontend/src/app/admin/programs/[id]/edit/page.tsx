'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramForm } from '@/components/admin/program/ProgramForm';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

export default function EditProgramPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: program, isLoading } = useQuery({
    queryKey: ['program-edit', id],
    queryFn: () => programsApi.getAll({ limit: 500 }),
    select: (res) => {
      const progs: Program[] = res.data.programs ?? [];
      return progs.find((p) => p._id === id);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <ProgramForm mode="edit" defaultData={program} programId={id} />
  );
}
