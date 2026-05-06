'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Trophy, Trash2, Plus, Search, ExternalLink, RefreshCw, Pencil, RotateCw, BrainCircuit } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui-custom/Pagination';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger
} from '@/components/ui/dialog';

export default function AdminRankingsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editingRank, setEditingRank] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  const { data: rankingsRes, isLoading } = useQuery({
    queryKey: ['admin-rankings', page],
    queryFn: () => api.get('/admin/rankings', { params: { page, limit: 50 } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/rankings/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking record deleted');
    },
  });

  const recheckAllMutation = useMutation({
    mutationFn: () => api.post('/admin/rankings/recheck'),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Recheck jobs queued');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger recheck');
    }
  });

  const recheckMutation = useMutation({
    mutationFn: (id: string) => api.post(`/admin/rankings/${id}/recheck`),
    onSuccess: (res) => {
      toast.success(res.data.message || 'Recheck job queued');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to trigger recheck');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/admin/rankings/${data._id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-rankings'] });
      toast.success('Ranking updated');
      setEditingRank(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update ranking');
    }
  });

  const handleEditClick = (rank: any) => {
    setEditingRank(rank);
    setEditFormData({
      _id: rank._id,
      globalRank: rank.globalRank || '',
      nationalRank: rank.nationalRank || '',
      year: rank.year,
      source: rank.source,
    });
  };

  const rankings = rankingsRes?.data || [];
  const meta = rankingsRes?.meta;
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
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="gap-2 border-primary/20 hover:bg-primary/5"
            onClick={() => recheckAllMutation.mutate()}
            disabled={recheckAllMutation.isPending}
          >
            {recheckAllMutation.isPending ? (
              <RotateCw className="h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="h-4 w-4 text-primary" />
            )}
            AI Enrich Ranking
          </Button>
        </div>
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
          <div className="rounded-xl border border-border/60 overflow-hidden mb-4">
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
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                            title="Edit"
                            onClick={() => handleEditClick(rank)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            title="Recheck"
                            onClick={() => recheckMutation.mutate(rank._id)}
                            disabled={recheckMutation.isPending}
                          >
                            <RefreshCw className={`h-4 w-4 ${recheckMutation.isPending ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="Delete"
                            onClick={() => deleteMutation.mutate(rank._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.pages > 1 && (
            <div className="flex justify-center pt-2">
              <Pagination 
                page={page} 
                totalPages={meta.pages} 
                onPageChange={setPage} 
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRank} onOpenChange={(open) => !open && setEditingRank(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ranking: {editingRank?.universityId?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="source" className="text-right">Source</Label>
              <Input id="source" value={editFormData.source} disabled className="col-span-3 bg-muted" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="year" className="text-right">Year</Label>
              <Input id="year" type="number" value={editFormData.year} onChange={(e) => setEditFormData({...editFormData, year: parseInt(e.target.value)})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="globalRank" className="text-right">Global Rank</Label>
              <Input id="globalRank" type="number" value={editFormData.globalRank} onChange={(e) => setEditFormData({...editFormData, globalRank: parseInt(e.target.value)})} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nationalRank" className="text-right">National Rank</Label>
              <Input id="nationalRank" type="number" value={editFormData.nationalRank} onChange={(e) => setEditFormData({...editFormData, nationalRank: parseInt(e.target.value)})} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRank(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(editFormData)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
