'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  GitCompare,
  AlertCircle,
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminApi } from '@/lib/api/admin.api';
import { DashboardQueryParams } from '@/types/adminDashboard';

// Dashboard Components
import { DashboardFilterBar } from '@/components/admin/dashboard/DashboardFilterBar';
import { MetricKpiBand } from '@/components/admin/dashboard/MetricKpiBand';
import { DataHealthChart } from '@/components/admin/dashboard/DataHealthChart';
import { ApplicationPipelineFunnel } from '@/components/admin/dashboard/ApplicationPipelineFunnel';
import { SourceHealthChart } from '@/components/admin/dashboard/SourceHealthChart';
import { DataCompletenessChart } from '@/components/admin/dashboard/DataCompletenessChart';
import { SyncReliabilityChart } from '@/components/admin/dashboard/SyncReliabilityChart';
import { OperationsSection } from '@/components/admin/dashboard/OperationsSection';

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  // Extract query filters from URL
  const range = searchParams.get('range') || '30d';
  const state = searchParams.get('state') || undefined;
  const source = searchParams.get('source') || undefined;
  const provider = searchParams.get('provider') || undefined;
  const comparePeriod = (searchParams.get('compare') as any) || 'previous_period';
  const fromParam = searchParams.get('from') || undefined;
  const toParam = searchParams.get('to') || undefined;

  const queryFilters: DashboardQueryParams = React.useMemo(() => {
    let from = fromParam;
    let to = toParam;

    if (!from || !to) {
      const now = new Date();
      to = now.toISOString().split('T')[0];
      const days = range === '7d' ? 7 : range === '90d' ? 90 : range === '1y' ? 365 : 30;
      const fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      from = fromDate.toISOString().split('T')[0];
    }

    return {
      from,
      to,
      state: state && state !== 'all' ? state : undefined,
      source: source && source !== 'all' ? source : undefined,
      provider: provider || undefined,
      comparePeriod,
    };
  }, [range, state, source, provider, comparePeriod, fromParam, toParam]);

  // Fetch live dashboard overview
  const {
    data: overviewResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-dashboard-overview', queryFilters],
    queryFn: async () => {
      const res = await adminApi.getDashboardOverview(queryFilters);
      return res.data.data;
    },
    staleTime: 60 * 1000, // 60s stale time aligned with server cache
  });

  const handleManualRefresh = async () => {
    // Force backend cache bypass
    await queryClient.fetchQuery({
      queryKey: ['admin-dashboard-overview', queryFilters],
      queryFn: async () => {
        const res = await adminApi.getDashboardOverview({ ...queryFilters, refresh: true });
        return res.data.data;
      },
    });
  };

  const overview = overviewResponse;

  return (
    <div className="space-y-6 sm:space-y-8 pb-16 max-w-[1520px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground tracking-tight">
              Decision Operations Dashboard
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-md">
              <ShieldCheck className="h-3 w-3 text-purple-400" />
              Live API Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Data integrity telemetry, ingestion pipelines, catalog quality, and student application conversion funnels.
          </p>
        </div>

        {/* Quick Action Navigation */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            size="sm"
            variant="outline"
            asChild
            className="bg-card dark:bg-slate-900 border-border/80 text-xs rounded-xl hover:bg-muted/50"
          >
            <Link href="/admin/cricos">
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 text-teal-400" />
              CRICOS Sync
            </Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            asChild
            className="bg-card dark:bg-slate-900 border-border/80 text-xs rounded-xl hover:bg-muted/50"
          >
            <Link href="/admin/staged-changes">
              <GitCompare className="h-3.5 w-3.5 mr-1.5 text-amber-400" />
              Review Queue
            </Link>
          </Button>

          <Button
            size="sm"
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl font-semibold shadow-md shadow-primary/20"
          >
            <Link href="/admin/universities/new">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Provider
            </Link>
          </Button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <DashboardFilterBar isLoading={isFetching} onRefresh={handleManualRefresh} />

      {/* Error State Banner */}
      {isError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between gap-4 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-rose-200">Unable to load dashboard telemetry</p>
              <p className="text-rose-400/80">{(error as any)?.message || 'Network request failed.'}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="border-rose-500/40 text-rose-200 hover:bg-rose-500/20 text-xs rounded-xl"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Top KPI Band (6 Cards) */}
      <section aria-label="Key Performance Indicators">
        <MetricKpiBand
          kpis={overview?.kpis}
          isLoading={isLoading}
          isError={isError}
        />
      </section>

      {/* Primary Row (Data Health Trend & Application Pipeline Funnel) */}
      <section aria-label="Primary Health and Pipeline Metrics" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Primary Trend Chart (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <DataHealthChart
            data={overview?.timeSeries?.dataHealth}
            isLoading={isLoading}
            isError={isError}
            lastUpdated={overview?.lastUpdated}
            timeScope={`Range: ${range.toUpperCase()}`}
          />
        </div>

        {/* Application Pipeline Funnel (4 cols) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <ApplicationPipelineFunnel
            data={overview?.applicationPipeline}
            isLoading={isLoading}
            isError={isError}
            lastUpdated={overview?.lastUpdated}
          />
        </div>
      </section>

      {/* Secondary Row (Source Health, Data Completeness, Sync Reliability) */}
      <section aria-label="Secondary Ingestion and Completeness Metrics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Source Health (Stacked Bar) */}
        <div>
          <SourceHealthChart
            data={overview?.sourceHealth}
            isLoading={isLoading}
            isError={isError}
            lastUpdated={overview?.lastUpdated}
          />
        </div>

        {/* Data Completeness by Field (Horizontal Bar) */}
        <div>
          <DataCompletenessChart
            data={overview?.dataCompletenessByField}
            isLoading={isLoading}
            isError={isError}
            lastUpdated={overview?.lastUpdated}
          />
        </div>

        {/* Sync Reliability Over Time */}
        <div className="md:col-span-2 lg:col-span-1">
          <SyncReliabilityChart
            data={overview?.timeSeries?.syncReliability}
            isLoading={isLoading}
            isError={isError}
            lastUpdated={overview?.lastUpdated}
          />
        </div>
      </section>

      {/* Operations Section (Review Queue, Failed Jobs, Overdue Sources, Recent Activity) */}
      <section aria-label="Operations and Queue Actions">
        <OperationsSection
          reviewQueue={overview?.operations?.reviewQueue}
          recentlyFailedJobs={overview?.operations?.recentlyFailedJobs}
          sourcesOverdue={overview?.operations?.sourcesOverdue}
          recentActivity={overview?.operations?.recentActivity}
          isLoading={isLoading}
          onRefreshQueue={handleManualRefresh}
        />
      </section>
    </div>
  );
}
