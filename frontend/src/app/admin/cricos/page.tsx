'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cricosApi } from '@/lib/api/cricos.api';
import { RefreshCw, Database, FileText, Search } from 'lucide-react';
import Link from 'next/link';

export default function CricosDashboard() {
  const [resources, setResources] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cricosApi.getResources().then(res => {
      setResources(res.data.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-display">CRICOS Management</h1>
        <Link href="/admin/cricos/provider-sync">
          <Button className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync Provider
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {resources && Object.entries(resources).map(([key, res]: [string, any]) => (
          <Card key={key} className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">{res.name}</h3>
            </div>
            <p className="text-xs text-muted-foreground break-all">{res.id}</p>
            <div className="flex gap-2">
              <Link href={`/admin/cricos/inspect?resourceId=${res.id}`} className="w-full">
                <Button variant="outline" size="sm" className="w-full gap-2">
                  <Search className="h-3 w-3" />
                  Inspect
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            Recent Sync Runs
          </h2>
          <div className="text-sm text-muted-foreground mb-4">
            Monitor the status of official CRICOS data imports.
          </div>
          <Link href="/admin/cricos/runs">
            <Button variant="outline">View All Runs</Button>
          </Link>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Raw Data Explorer
          </h2>
          <div className="text-sm text-muted-foreground mb-4">
            Browse institutions and courses stored directly from CRICOS.
          </div>
          <div className="flex gap-2">
            <Link href="/admin/cricos/raw/institutions">
              <Button variant="outline" size="sm">Institutions</Button>
            </Link>
            <Link href="/admin/cricos/raw/courses">
              <Button variant="outline" size="sm">Courses</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
