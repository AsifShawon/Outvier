'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Settings, Trash2, Check, X, Globe, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import api from '@/lib/api';

export default function DataSourcesPage() {
  const qc = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newSource, setNewSource] = useState({ name: '', type: 'official_site', baseUrl: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['data-sources'],
    queryFn: () => api.get('/admin/sync/data-sources').then(r => r.data),
  });

  const sources = data?.data || [];

  const createSource = useMutation({
    mutationFn: (source: any) => api.post('/admin/sync/data-sources', source),
    onSuccess: () => {
      toast.success('Data source added');
      setIsAdding(false);
      setNewSource({ name: '', type: 'official_site', baseUrl: '' });
      qc.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });

  const deleteSource = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sync/data-sources/${id}`),
    onSuccess: () => {
      toast.success('Data source removed');
      qc.invalidateQueries({ queryKey: ['data-sources'] });
    },
  });

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display">Data Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure the websites and endpoints Outvier uses to extract program data.
          </p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Add Source
        </Button>
      </div>

      {isAdding && (
        <div className="bg-muted/30 border border-border/50 rounded-xl p-5 flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Name</label>
            <Input 
              value={newSource.name} 
              onChange={e => setNewSource({...newSource, name: e.target.value})} 
              placeholder="University Official" 
              className="rounded-lg h-9"
            />
          </div>
          <div className="space-y-1.5 flex-1 min-w-[250px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Base URL</label>
            <Input 
              value={newSource.baseUrl} 
              onChange={e => setNewSource({...newSource, baseUrl: e.target.value})} 
              placeholder="https://..." 
              className="rounded-lg h-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setIsAdding(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={() => createSource.mutate(newSource)} disabled={createSource.isPending} className="rounded-xl">Save</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)
        ) : sources.length === 0 ? (
          <div className="col-span-2 py-20 text-center border rounded-xl border-dashed">
            <Globe className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No data sources configured yet.</p>
          </div>
        ) : (
          sources.map((source: any) => (
            <div key={source._id} className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-colors group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{source.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[200px]">{source.baseUrl}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteSource.mutate(source._id)}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <Badge variant="outline" className="capitalize">{source.type.replace('_', ' ')}</Badge>
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{source.allowed ? 'Robots Allowed' : 'Restricted'}</span>
                </div>
                <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                  <span className={`h-2 w-2 rounded-full ${source.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                  <span className="capitalize">{source.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
