export type IngestionJobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type IngestionJobType = 'single_university' | 'bulk_university' | 'refresh_programs' | 'all_universities';

export interface IIngestionJobLog {
  timestamp: string;
  step: string;
  status: 'info' | 'warning' | 'error' | 'success';
  message: string;
  error?: string;
  details?: Record<string, any>;
}

export interface IIngestionJobProgress {
  percent: number;
  stage: string;
  programsDiscovered?: number;
  programsCreated?: number;
  programsUpdated?: number;
  programsSkipped?: number;
  pagesVisited?: number;
  urlsFound?: number;
  failedUrls?: string[];
}

export interface IngestionJob {
  _id: string;
  jobType: IngestionJobType;
  universityId: {
    _id: string;
    name: string;
    slug?: string;
    officialWebsite?: string;
  } | string;
  universityName: string;
  uploadedBy?: string;
  bullmqJobId?: string;
  status: IngestionJobStatus;
  progress: IIngestionJobProgress;
  logs?: IIngestionJobLog[]; // Only populated in the /logs endpoint
  errorMessages: string[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgramEvidence {
  value: any;
  sourceUrl: string;
  sourceType: string;
  confidence: number;
  extractedAt: string;
}

export interface ProgramExtractionSourceData {
  confidenceScore: number;
  missingFields: string[];
  warnings: Array<{ field: string; message: string; severity: string }>;
  dataSourceType: string;
  extractedAt: string;
  lastCheckedAt: string;
  aiSummary: string;
  sourceUrls: string[];
  sourceEvidence: Record<string, ProgramEvidence>;
}
