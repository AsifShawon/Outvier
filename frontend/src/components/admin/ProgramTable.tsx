'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteDialog } from '@/components/ui-custom/DeleteDialog';
import { Pagination } from '@/components/ui-custom/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { programsApi } from '@/lib/api/programs.api';
import { Program } from '@/types/program';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

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
  
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const debouncedSearch = useDebounce(search, 350);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-programs', { search: debouncedSearch, level, page, limit }],
    queryFn: () => programsApi.getAll({ 
      search: debouncedSearch, 
      level: level !== 'all' ? level : undefined,
      page, 
      limit 
    }),
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
  const meta = data?.data?.pagination;

  const handleFilterChange = (key: string, value: string) => {
    setPage(1);
    if (key === 'search') setSearch(value);
    if (key === 'level') setLevel(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search programs..."
            className="h-9 w-64 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
          <Select value={level} onValueChange={(v) => handleFilterChange('level', v)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {Object.entries(levelLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/admin/programs/new">
          <Button size="sm" className="gap-2 h-9">
            <Plus className="h-3.5 w-3.5" />
            Add Program
          </Button>
        </Link>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 text-[11px] uppercase tracking-wider font-bold text-slate-500">
              <TableHead className="w-[300px] pl-6">Program</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Academic Details</TableHead>
              <TableHead>Tuition & Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-4 w-full" /></TableCell>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : programs.map((program) => (
                  <TableRow key={program._id} className="hover:bg-slate-50/50 group transition-colors">
                    <TableCell className="pl-6">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-slate-900 line-clamp-1 group-hover:text-deep-green transition-colors">{program.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium truncate italic">{program.field || 'General'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {program.logoUrl && <img src={program.logoUrl} alt="" className="w-5 h-5 rounded-md object-contain" />}
                        <span className="text-xs font-semibold text-slate-700 truncate max-w-[150px]">{program.universityName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="secondary" className="w-fit text-[10px] bg-slate-100 text-slate-600 border-none font-bold py-0 h-4">
                          {levelLabels[program.level] || program.level}
                        </Badge>
                        <span className="text-[10px] text-slate-400 capitalize">{program.campusMode || 'On Campus'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                          {program.tuitionFee ? `$${program.tuitionFee.toLocaleString()}` : '—'}
                          <span className="text-[10px] font-normal text-slate-400 ml-1">/yr</span>
                        </span>
                        <span className="text-[10px] text-slate-500">{program.duration || '—'} years</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={program.status === 'active' ? 'default' : 'outline'} 
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-bold",
                          program.status === 'active' ? "bg-green-100 text-green-700 border-none" : "text-slate-400 border-slate-200"
                        )}
                      >
                        {program.status || 'Active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/programs/${program.slug}`} target="_blank">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-deep-green hover:bg-green-50">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/programs/${program._id}/edit`}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => { setDeleteId(program._id); setDeleteName(program.name); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl w-full" />)
        ) : (
          programs.map((program) => (
            <Card key={program._id} className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 leading-tight line-clamp-2">{program.name}</h3>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">{program.universityName}</p>
                  </div>
                  <Badge 
                    variant={program.status === 'active' ? 'default' : 'outline'} 
                    className={cn(
                      "text-[10px] rounded-full shrink-0 ml-2",
                      program.status === 'active' ? "bg-green-100 text-green-700 border-none" : ""
                    )}
                  >
                    {program.status || 'Active'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Level</p>
                    <p className="text-xs font-bold text-slate-700">{levelLabels[program.level] || program.level}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Tuition/yr</p>
                    <p className="text-xs font-bold text-slate-700">
                      {program.tuitionFee ? `$${program.tuitionFee.toLocaleString()}` : '—'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Duration</p>
                    <p className="text-xs font-bold text-slate-700">{program.duration || '—'} years</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Study Mode</p>
                    <p className="text-xs font-bold text-slate-700 capitalize">{program.campusMode || 'On Campus'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-9 text-xs" asChild>
                    <Link href={`/admin/programs/${program._id}/edit`}>Edit Program</Link>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl" asChild>
                    <Link href={`/programs/${program.slug}`} target="_blank">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => { setDeleteId(program._id); setDeleteName(program.name); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {meta && meta.pages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-xs text-slate-400 font-medium">
            Showing <span className="text-slate-900 font-bold">{programs.length}</span> of <span className="text-slate-900 font-bold">{meta.total}</span> programs
          </p>
          <div className="flex items-center gap-4">
            <Select value={limit.toString()} onValueChange={(v) => { setLimit(parseInt(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-9 text-xs rounded-xl border-slate-200">
                <SelectValue placeholder={limit.toString()} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="10">10 / pg</SelectItem>
                <SelectItem value="20">20 / pg</SelectItem>
                <SelectItem value="50">50 / pg</SelectItem>
                <SelectItem value="100">100 / pg</SelectItem>
              </SelectContent>
            </Select>
            <Pagination
              page={page}
              totalPages={meta.pages}
              onPageChange={setPage}
            />
          </div>
        </div>
      )}

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
