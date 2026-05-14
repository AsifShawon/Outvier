'use client';

import { useState, useEffect } from 'react';
import { adminScholarshipsApi } from '@/lib/api/scholarships.api';
import { Scholarship } from '@/types/scholarship';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Edit, ExternalLink, MoreVertical, Trash, Archive, Eye, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function ScholarshipTable() {
  const [data, setData] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchScholarships = async () => {
    try {
      setLoading(true);
      const res = await adminScholarshipsApi.getScholarships({ search });
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch scholarships:', error);
      toast.error('Failed to load scholarships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchScholarships(), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleArchive = async (id: string) => {
    if (!confirm('Are you sure you want to archive this scholarship?')) return;
    try {
      await adminScholarshipsApi.archiveScholarship(id);
      toast.success('Scholarship archived successfully');
      fetchScholarships();
    } catch (error) {
      toast.error('Failed to archive scholarship');
    }
  };
  
  const handleRestore = async (id: string) => {
    try {
      await adminScholarshipsApi.restoreScholarship(id);
      toast.success('Scholarship restored to draft');
      fetchScholarships();
    } catch (error) {
      toast.error('Failed to restore scholarship');
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-700',
      published: 'bg-green-100 text-green-700',
      archived: 'bg-red-100 text-red-700',
      expired: 'bg-orange-100 text-orange-700',
      unpublished: 'bg-slate-100 text-slate-700',
    };
    return <Badge className={map[status] || 'bg-slate-100 text-slate-700'} variant="outline">{status}</Badge>;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <Input
          placeholder="Search scholarships..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>University</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-[200px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[80px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                    <p>No scholarships found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover border" />
                      )}
                      <div>
                        {item.title}
                        {item.featured && <Badge variant="secondary" className="ml-2 text-[10px]">Featured</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{item.category}</TableCell>
                  <TableCell>
                    {item.linkedUniversity && typeof item.linkedUniversity !== 'string' ? (
                      <div className="flex items-center gap-2">
                        {item.linkedUniversity.logoUrl && (
                          <img src={item.linkedUniversity.logoUrl} alt="" className="w-5 h-5 rounded-sm object-contain" />
                        )}
                        <span className="text-sm text-slate-600">{item.linkedUniversity.name}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.deadlineDate ? new Date(item.deadlineDate).toLocaleDateString() : <span className="text-slate-400">-</span>}
                  </TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/scholarships/${item.slug}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" /> View Public
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/scholarships/${item._id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        {item.status === 'archived' ? (
                          <DropdownMenuItem onClick={() => handleRestore(item._id)}>
                            <RefreshCw className="h-4 w-4 mr-2" /> Restore
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => handleArchive(item._id)} className="text-red-600 focus:text-red-600">
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
