/**
 * IngestionJob.model.ts
 * Tracks AI-assisted program discovery jobs triggered by admin university uploads.
 * Separate from the existing SyncJob to avoid coupling the legacy sync pipeline.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

export type IngestionJobType =
  | 'single_university'
  | 'bulk_university'
  | 'refresh_programs';

export type IngestionJobStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'partial';

export interface IIngestionJobLog {
  timestamp: Date;
  step: string;
  status: 'info' | 'warn' | 'error' | 'success';
  message: string;
  sourceUrl?: string;
  error?: string;
}

export interface IIngestionJobProgress {
  percent: number;
  stage: string;
  pagesVisited: number;
  urlsFound: number;
  programsDiscovered: number;
  programsCreated: number;
  programsUpdated: number;
  programsSkipped: number;
  processedUrls: string[];
  failedUrls: string[];
  warnings: number;
}

export interface IIngestionJob extends Document {
  jobType: IngestionJobType;
  universityId: Types.ObjectId;
  universityName: string;
  uploadedBy?: string;
  bullmqJobId?: string;
  status: IngestionJobStatus;
  progress: IIngestionJobProgress;
  logs: IIngestionJobLog[];
  errorMessages: string[];
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const IngestionJobLogSchema = new Schema<IIngestionJobLog>(
  {
    timestamp: { type: Date, default: Date.now },
    step: { type: String, required: true },
    status: { type: String, enum: ['info', 'warn', 'error', 'success'], default: 'info' },
    message: { type: String, required: true },
    sourceUrl: String,
    error: String,
  },
  { _id: false }
);

const IngestionJobProgressSchema = new Schema<IIngestionJobProgress>(
  {
    percent: { type: Number, default: 0, min: 0, max: 100 },
    stage: { type: String, default: 'queued' },
    pagesVisited: { type: Number, default: 0 },
    urlsFound: { type: Number, default: 0 },
    programsDiscovered: { type: Number, default: 0 },
    programsCreated: { type: Number, default: 0 },
    programsUpdated: { type: Number, default: 0 },
    programsSkipped: { type: Number, default: 0 },
    processedUrls: [{ type: String }],
    failedUrls: [{ type: String }],
    warnings: { type: Number, default: 0 },
  },
  { _id: false }
);

const IngestionJobSchema = new Schema<IIngestionJob>(
  {
    jobType: {
      type: String,
      enum: ['single_university', 'bulk_university', 'refresh_programs'],
      required: true,
    },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    universityName: { type: String, required: true },
    uploadedBy: { type: String },
    bullmqJobId: { type: String, index: true },
    status: {
      type: String,
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled', 'partial'],
      default: 'queued',
    },
    progress: { type: IngestionJobProgressSchema, default: () => ({}) },
    logs: [IngestionJobLogSchema],
    errorMessages: [{ type: String }],
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

IngestionJobSchema.index({ status: 1, createdAt: -1 });
IngestionJobSchema.index({ universityId: 1, status: 1 });

export const IngestionJob = mongoose.model<IIngestionJob>('IngestionJob', IngestionJobSchema);
