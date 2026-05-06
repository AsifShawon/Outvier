'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cricosApi } from '@/lib/api/cricos.api';
import { Loader2, Search, MapPin } from 'lucide-react';

export default function RawLocationsPage() {
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [providerCode, setProviderCode] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { fetchData(); }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await cricosApi.getRawLocations({ providerCode: providerCode || undefined, page });
      setData(res.data.data);
      setTotal(res.data.meta?.total ?? 0);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => { setPage(1); fetchData(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <MapPin className="h-8 w-8 text-primary" />
          Raw Locations
        </h1>
        <div className="flex gap-2">
          <Input
            placeholder="Filter by provider code..."
            value={providerCode}
            onChange={(e) => setProviderCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-56 font-mono uppercase"
          />
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {total.toLocaleString()} locations found
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">Provider</th>
              <th className="p-4 text-sm font-semibold">Location Name</th>
              <th className="p-4 text-sm font-semibold">Type</th>
              <th className="p-4 text-sm font-semibold">City</th>
              <th className="p-4 text-sm font-semibold">State</th>
              <th className="p-4 text-sm font-semibold">Postcode</th>
              <th className="p-4 text-sm font-semibold">Fetched</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-12 text-center"><Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" /></td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No locations found</td></tr>
            ) : data.map((item) => (
              <tr key={item._id} className="border-b text-sm hover:bg-muted/30 transition-colors">
                <td className="p-4 font-mono text-xs">{item.cricosProviderCode}</td>
                <td className="p-4 max-w-[200px] truncate">{item.locationName}</td>
                <td className="p-4 text-xs text-muted-foreground max-w-[140px] truncate">{item.locationType}</td>
                <td className="p-4">{item.city}</td>
                <td className="p-4">{item.state}</td>
                <td className="p-4 font-mono text-xs">{item.postcode}</td>
                <td className="p-4 text-xs text-muted-foreground">
                  {item.fetchedAt ? new Date(item.fetchedAt).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={data.length === 0}>Next</Button>
        </div>
      </div>
    </div>
  );
}
