'use client';

import { PowerBIReport } from '@/components/analytics/PowerBIEmbed';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold font-display">Platform Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive Power BI dashboards for deep insights into student engagement and platform health.
        </p>
      </div>

      <PowerBIReport />
    </div>
  );
}
