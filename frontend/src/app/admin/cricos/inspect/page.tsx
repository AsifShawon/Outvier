'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { cricosApi } from '@/lib/api/cricos.api';
import { Loader2, Table as TableIcon } from 'lucide-react';

export default function CricosInspectPage() {
  const searchParams = useSearchParams();
  const resourceId = searchParams.get('resourceId');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resourceId) {
      cricosApi.inspectFields(resourceId).then(res => {
        setData(res.data.data);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [resourceId]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>;
  if (!data) return <div className="p-12 text-center text-muted-foreground">Resource not found or failed to fetch</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-display flex items-center gap-3">
        <TableIcon className="h-8 w-8 text-primary" />
        Resource Inspection
      </h1>
      <p className="text-muted-foreground text-sm">ID: {resourceId}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-6">
          <h3 className="font-bold text-lg mb-4">Available Fields</h3>
          <div className="flex flex-wrap gap-2">
            {data.fields.map((f: string) => (
              <div key={f} className="px-2 py-1 bg-muted rounded text-xs font-mono">
                {f}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 overflow-hidden">
          <h3 className="font-bold text-lg mb-4">Sample Row Data (JSON)</h3>
          <pre className="text-[10px] bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-[500px]">
            {JSON.stringify(data.sample, null, 2)}
          </pre>
        </Card>
      </div>
    </div>
  );
}
