'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { BarChart3, Trash2, Plus, Search, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function AdminOutcomesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: outcomesRes, isLoading } = useQuery({
    queryKey: ['admin-outcomes'],
    queryFn: () => api.get('/admin/outcomes').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/outcomes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-outcomes'] });
      toast.success('Outcome record deleted');
    },
  });

  const outcomes = outcomesRes?.data || [];
  const filtered = outcomes.filter((o: any) => 
    o.universityId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display">Graduate Outcomes</h1>
          <p className="text-sm text-muted-foreground mt-1">Track employment rates and graduate satisfaction metrics.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Outcome Data
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by university..." 
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
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Year</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Employment Rate</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Satisfaction</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Median Salary</th>
                  <th className="px-4 py-3 text-right font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-4 py-4 h-12 bg-muted/20" />
                    </tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No outcome data found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((o: any) => (
                    <tr key={o._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-900">{o.universityId?.name}</td>
                      <td className="px-4 py-4 font-mono">{o.year}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="font-bold">{o.graduateEmploymentRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">{o.graduateSatisfactionRate}%</td>
                      <td className="px-4 py-4 font-mono text-slate-700">${o.medianSalary?.toLocaleString() || '—'}</td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(o._id)}
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
