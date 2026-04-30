'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { GraduationCap, Trash2, Plus, Search, DollarSign } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function AdminScholarshipsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: scholarshipsRes, isLoading } = useQuery({
    queryKey: ['admin-scholarships'],
    queryFn: () => api.get('/admin/scholarships').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/scholarships/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-scholarships'] });
      toast.success('Scholarship deleted');
    },
  });

  const scholarships = scholarshipsRes?.data || [];
  const filtered = scholarships.filter((s: any) => 
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.universityId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display">University Scholarships</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage active scholarships and financial aid.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Scholarship
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or university..." 
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Scholarship Name</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-4 py-4 h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                      No scholarships found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s: any) => (
                    <tr key={s._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{s.name}</td>
                      <td className="px-4 py-4 font-medium text-slate-600">{s.universityId?.name}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                          <DollarSign className="h-3.5 w-3.5" />
                          {s.amount || 'Varies'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant={s.status === 'approved' ? 'default' : 'secondary'} className="rounded-full px-2 py-0 h-5 text-[9px] uppercase font-bold tracking-wider">
                          {s.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(s._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
