'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { universitiesApi } from '@/lib/api/universities.api';
import { University } from '@/types/university';

export function UniversityTable() {
  const router = useRouter();
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-universities'],
    queryFn: () => universitiesApi.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => universitiesApi.delete(id),
    onSuccess: () => {
      toast.success('University deleted');
      qc.invalidateQueries({ queryKey: ['admin-universities'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete university'),
  });

  const universities: University[] = data?.data?.universities || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">All Universities</h2>
        <Link href="/admin/universities/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add University
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Ranking</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              : universities.map((uni) => (
                  <TableRow key={uni._id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm">{uni.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{uni.state}</Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{uni.type}</TableCell>
                    <TableCell className="text-sm">{uni.ranking ? `#${uni.ranking}` : '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/universities/${uni.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/universities/${uni._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { setDeleteId(uni._id); setDeleteName(uni.name); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      <DeleteDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        loading={deleteMutation.isPending}
        title={`Delete "${deleteName}"?`}
        description="This will permanently delete the university and cannot be undone."
      />
    </div>
  );
}
