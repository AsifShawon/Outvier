export interface KpiMetric {
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  timeScope: string;
  definition: string;
}

export interface DataHealthPoint {
  date: string;
  verified: number;
  stale: number;
  incomplete: number;
}

export interface SyncReliabilityPoint {
  date: string;
  successful: number;
  partial: number;
  failed: number;
}

export interface PipelineStageItem {
  stage: string;
  stageKey: string;
  count: number;
  conversionRate: number;
  dropOffRate: number;
  cumulativeConversion: number;
}

export interface SourceHealthItem {
  sourceId: string;
  name: string;
  type: string;
  totalRecords: number;
  healthy: number;
  warning: number;
  failing: number;
  lastSyncAt: string | null;
  status: 'healthy' | 'warning' | 'failing';
  slaHours: number;
}

export interface FieldCompletenessItem {
  field: string;
  label: string;
  completedPercentage: number;
  totalRecords: number;
  populatedCount: number;
  missingCount: number;
  criticality: 'high' | 'medium' | 'low';
}

export interface ReviewQueueItem {
  id: string;
  entityType: string;
  entityName: string;
  providerName: string;
  changeType: string;
  confidence: number;
  warningsCount: number;
  missingFieldsCount: number;
  createdAt: string;
  diffSummary?: string;
}

export interface FailedJobItem {
  id: string;
  jobType: string;
  target: string;
  errorMessage: string;
  failedAt: string;
  source: string;
  retryable: boolean;
}

export interface OverdueSourceItem {
  id: string;
  name: string;
  type: string;
  lastSyncAt: string | null;
  daysOverdue: number;
  slaHours: number;
  priority: number;
}

export interface RecentActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  entityId?: string;
}

export interface DashboardOverviewData {
  filters: {
    from: string;
    to: string;
    provider?: string;
    state?: string;
    source?: string;
    comparePeriod: string;
  };
  kpis: {
    verifiedActivePrograms: KpiMetric;
    staleRecords: KpiMetric;
    pendingStagedChanges: KpiMetric;
    successfulSyncRate: KpiMetric;
    activeApplications: KpiMetric;
    overdueTasks: KpiMetric;
  };
  timeSeries: {
    dataHealth: DataHealthPoint[];
    syncReliability: SyncReliabilityPoint[];
  };
  applicationPipeline: PipelineStageItem[];
  sourceHealth: SourceHealthItem[];
  dataCompletenessByField: FieldCompletenessItem[];
  operations: {
    reviewQueue: ReviewQueueItem[];
    recentlyFailedJobs: FailedJobItem[];
    sourcesOverdue: OverdueSourceItem[];
    recentActivity: RecentActivityItem[];
  };
  lastUpdated: string;
  cached: boolean;
}

export interface DashboardQueryParams {
  from?: string;
  to?: string;
  provider?: string;
  state?: string;
  source?: string;
  comparePeriod?: 'previous_period' | 'previous_year' | 'none';
  refresh?: boolean;
}
