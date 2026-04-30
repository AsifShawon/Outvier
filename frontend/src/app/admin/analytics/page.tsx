'use client';

import { MetabaseEmbed } from '@/components/analytics/MetabaseEmbed';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive open-source dashboards powered by Metabase.
        </p>
      </div>

      <MetabaseEmbed />
    </div>
  );
}
