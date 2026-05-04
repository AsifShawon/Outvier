'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trophy, Trash2, Plus, Search, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

export default function AdminRankingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: rankingsRes, isLoading } = useQuery({
    queryKey: ['admin-rankings'],
    queryFn: () => api.get('/admin/rankings').then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/rankings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking record deleted');
    },
  });

  const rankings = rankingsRes?.data || [];
  const filteredRankings = rankings.filter((r: any) => 
    r.universityId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.source?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display">University Rankings</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage global and national university rankings.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Ranking
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by university or source..." 
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border/60">
                <tr>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">University</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Year</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">Global Rank</th>
                  <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[10px] text-muted-foreground">National Rank</th>
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
                ) : filteredRankings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      No ranking records found.
                    </td>
                  </tr>
                ) : (
                  filteredRankings.map((rank: any) => (
                    <tr key={rank._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4 font-semibold text-slate-900">
                        {rank.universityId?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="secondary" className="bg-primary-50 text-primary-700 hover:bg-primary-100 border-none">
                          {rank.source}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground font-mono">{rank.year}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          #{rank.globalRank}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-600">#{rank.nationalRank || '—'}</td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteMutation.mutate(rank._id)}
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
