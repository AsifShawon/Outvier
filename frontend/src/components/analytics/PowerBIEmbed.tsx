'use client';

import React, { useState, useEffect } from 'react';
import { PowerBIEmbed } from 'powerbi-client-react';
import { models } from 'powerbi-client';
import { adminApi } from '@/lib/api/admin.api';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

export function PowerBIReport() {
  const [embedConfig, setEmbedConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await adminApi.getPowerBiToken();
        if (res.data.success) {
          setEmbedConfig(res.data.data);
        } else {
          setError(res.data.message || 'Failed to load Power BI config');
        }
      } catch (err: any) {
        // Handle 503 Service Unavailable gracefully (not configured)
        if (err?.response?.status === 503) {
          setError('Power BI integration is not configured. Add POWERBI_* variables to backend .env');
        } else {
          setError(err?.response?.data?.message || 'Error fetching Power BI token');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  if (isLoading) {
    return <Skeleton className="w-full h-[600px] rounded-xl" />;
  }

  if (error || !embedConfig) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/10 border-border/50">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-8 w-8 text-amber-500" />
        </div>
        <h3 className="text-lg font-semibold">Analytics Unavailable</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border/50 bg-white">
      <PowerBIEmbed
        embedConfig={{
          type: 'report',
          id: embedConfig.reportId,
          embedUrl: embedConfig.embedUrl,
          accessToken: embedConfig.embedToken,
          tokenType: models.TokenType.Embed,
          settings: {
            panes: {
              filters: { expanded: false, visible: true },
              pageNavigation: { visible: true },
            },
            background: models.BackgroundType.Transparent,
          },
        }}
        cssClassName="w-full h-full"
        getEmbeddedComponent={(embeddedReport) => {
          (window as any).report = embeddedReport;
        }}
      />
    </div>
  );
}
