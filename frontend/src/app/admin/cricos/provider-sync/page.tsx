'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cricosApi } from '@/lib/api/cricos.api';
import { RefreshCw, Search, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderSyncPage() {
  const [providerCode, setProviderCode] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handlePreview = async () => {
    if (!providerCode) return toast.error('Enter a provider code');
    setLoading(true);
    try {
      const res = await cricosApi.previewProvider(providerCode);
      setPreview(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await cricosApi.syncProvider(providerCode);
      toast.success('Sync started! Check sync runs for status.');
      setProviderCode('');
      setPreview(null);
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold font-display">CRICOS Provider Sync</h1>
      
      <Card className="p-6">
        <div className="flex gap-4">
          <Input 
            placeholder="Enter CRICOS Provider Code (e.g. 00008C)" 
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value)}
            className="uppercase"
          />
          <Button onClick={handlePreview} disabled={loading} variant="secondary">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
            Preview
          </Button>
        </div>
      </Card>

      {preview && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4">Found Records</h3>
            <div className="space-y-4">
              <StatRow label="Institutions" value={preview.counts.institutions} />
              <StatRow label="Courses" value={preview.counts.courses} />
              <StatRow label="Locations" value={preview.counts.locations} />
              <StatRow label="Course Locations" value={preview.counts.courseLocations} />
            </div>
            
            <Button 
              className="w-full mt-8 gap-2" 
              onClick={handleSync} 
              disabled={syncing}
            >
              {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Sync Data to Staging
            </Button>
          </Card>

          <Card className="p-6 bg-secondary/20">
            <h3 className="font-bold text-lg mb-4">Sample Data</h3>
            {preview.samples.institution ? (
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {preview.samples.institution["Institution Name"]}</p>
                <p><strong>Type:</strong> {preview.samples.institution["Institution Type"]}</p>
                <p><strong>Website:</strong> {preview.samples.institution["Website"]}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                <p>No records found for this code</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string, value: number }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold", value > 0 ? "text-primary" : "text-muted-foreground")}>
        {value}
      </span>
    </div>
  );
}

import { cn } from '@/lib/utils';
