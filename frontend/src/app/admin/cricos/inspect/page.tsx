'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { cricosApi } from '@/lib/api/cricos.api';
import { Loader2, Table as TableIcon, Search, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CricosInspectPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resourceId = searchParams.get('resourceId');
  
  const [resources, setResources] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    cricosApi.getResources().then(res => {
      setResources(res.data.data);
      setLoadingResources(false);
    }).catch(() => setLoadingResources(false));
  }, []);

  useEffect(() => {
    if (resourceId) {
      setLoadingData(true);
      cricosApi.inspectFields(resourceId).then(res => {
        setData(res.data.data);
        setLoadingData(false);
      }).catch(() => setLoadingData(false));
    } else {
      setData(null);
    }
  }, [resourceId]);

  const handleResourceChange = (val: string) => {
    router.push(`/admin/cricos/inspect?resourceId=${val}`);
  };

  if (loadingResources) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display flex items-center gap-3">
            <TableIcon className="h-8 w-8 text-primary" />
            Field Inspector
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Inspect DataStore fields and sample records</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select value={resourceId || ''} onValueChange={handleResourceChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select resource..." />
            </SelectTrigger>
            <SelectContent>
              {resources && Object.entries(resources).map(([key, res]: [string, any]) => (
                <SelectItem key={key} value={res.id}>
                  {res.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingData ? (
        <div className="flex flex-col items-center justify-center p-24 bg-card rounded-xl border">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Fetching resource schema and samples...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <Card className="p-6 lg:col-span-1 border-primary/10">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Available Fields
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.fields.map((f: string) => (
                <div key={f} className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs font-mono transition-colors">
                  {f}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">
              Total fields: {data.fields.length}
            </p>
          </Card>

          <Card className="p-6 lg:col-span-2 overflow-hidden border-primary/10">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <TableIcon className="h-4 w-4" />
              Sample Row Data
            </h3>
            <div className="relative">
              <div className="absolute top-2 right-2 px-2 py-1 bg-slate-800 text-slate-400 text-[10px] rounded uppercase font-bold tracking-wider">
                JSON
              </div>
              <pre className="text-[11px] bg-slate-900 text-slate-100 p-6 rounded-xl overflow-auto max-h-[600px] shadow-inner custom-scrollbar">
                {JSON.stringify(data.sample, null, 2)}
              </pre>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-24 bg-muted/30 rounded-xl border border-dashed">
          <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Select a resource to inspect its fields</p>
        </div>
      )}
    </div>
  );
}

