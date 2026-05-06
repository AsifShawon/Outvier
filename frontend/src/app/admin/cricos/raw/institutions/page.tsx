'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cricosApi } from '@/lib/api/cricos.api';
import { Loader2, Search, Building2 } from 'lucide-react';

export default function RawInstitutionsPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await cricosApi.getRawInstitutions({ q: search, page });
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          Raw Institutions
        </h1>
        <div className="flex gap-2">
          <Input 
            placeholder="Search name or provider code..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => { setPage(1); fetchData(); }}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="p-4 text-sm font-semibold">Code</th>
              <th className="p-4 text-sm font-semibold">Name</th>
              <th className="p-4 text-sm font-semibold">State</th>
              <th className="p-4 text-sm font-semibold">Fetched At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-12 text-center"><Loader2 className="animate-spin mx-auto" /></td></tr>
            ) : data.map(item => (
              <tr key={item._id} className="border-b text-sm">
                <td className="p-4 font-mono">{item.cricosProviderCode}</td>
                <td className="p-4">{item.institutionName}</td>
                <td className="p-4">{item.postalAddressState}</td>
                <td className="p-4 text-muted-foreground">{new Date(item.fetchedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex justify-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>
    </div>
  );
}
