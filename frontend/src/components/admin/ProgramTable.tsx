'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';

const levelLabels: Record<string, string> = {
  bachelor: 'Bachelor',
  master: 'Master',
  phd: 'PhD',
  diploma: 'Diploma',
  certificate: 'Certificate',
  graduate_certificate: 'Grad. Cert.',
};

export function ProgramTable() {
  const qc = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-programs'],
    queryFn: () => programsApi.getAll({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => programsApi.delete(id),
    onSuccess: () => {
      toast.success('Program deleted');
      qc.invalidateQueries({ queryKey: ['admin-programs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Failed to delete program'),
  });

  const programs: Program[] = data?.data?.programs || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">All Programs</h2>
        <Link href="/admin/programs/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-3.5 w-3.5" />
            Add Program
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Name</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Field</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : programs.map((program) => (
                  <TableRow key={program._id} className="hover:bg-muted/30">
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{program.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{program.universityName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px]">{levelLabels[program.level]}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{program.field}</TableCell>
                    <TableCell className="text-xs capitalize">{program.campusMode}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/programs/${program.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Link href={`/admin/programs/${program._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => { setDeleteId(program._id); setDeleteName(program.name); }}
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
        description="This will permanently delete the program and cannot be undone."
      />
    </div>
  );
}
