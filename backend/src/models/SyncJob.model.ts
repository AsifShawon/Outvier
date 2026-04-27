import mongoose, { Document, Schema, Types } from 'mongoose';

export type SyncJobType =
  | 'crawl_university'
  | 'crawl_programs'
  | 'crawl_tuition'
  | 'crawl_scholarships'
  | 'ranking_refresh'
  | 'outcome_refresh';

export type SyncJobStatus = 'queued' | 'running' | 'completed' | 'failed';

export interface ISyncJobStats {
  pagesVisited?: number;
  recordsFound?: number;
  recordsChanged?: number;
  errors?: number;
}

export interface ISyncJob extends Document {
  jobType: SyncJobType;
  targetUniversityId?: Types.ObjectId;
  status: SyncJobStatus;
  startedAt?: Date;
  finishedAt?: Date;
  logs?: string[];
  stats?: ISyncJobStats;
  createdAt: Date;
  updatedAt: Date;
}

const SyncJobStatsSchema = new Schema<ISyncJobStats>(
  {
    pagesVisited: { type: Number, default: 0 },
    recordsFound: { type: Number, default: 0 },
    recordsChanged: { type: Number, default: 0 },
    errors: { type: Number, default: 0 },
  },
  { _id: false }
);

const SyncJobSchema = new Schema<ISyncJob>(
  {
    jobType: {
      type: String,
      enum: ['crawl_university', 'crawl_programs', 'crawl_tuition', 'crawl_scholarships', 'ranking_refresh', 'outcome_refresh'],
      required: true,
    },
    targetUniversityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed'],
      default: 'queued',
    },
    startedAt: Date,
    finishedAt: Date,
    logs: [{ type: String }],
    stats: SyncJobStatsSchema,
  },
  { timestamps: true }
);

SyncJobSchema.index({ status: 1, createdAt: -1 });
SyncJobSchema.index({ jobType: 1, status: 1 });

export const SyncJob = mongoose.model<ISyncJob>('SyncJob', SyncJobSchema);
