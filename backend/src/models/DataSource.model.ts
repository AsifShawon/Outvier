/**
 * DataSource.model.ts — Extended Data Source Registry Model.
 * Tracks source licensing, priority ranking, refresh SLAs, ETag freshness, and parser versioning.
 */
import mongoose, { Document, Schema } from 'mongoose';

export type DataSourceType =
  | 'official_api'
  | 'official_site'
  | 'ranking'
  | 'government'
  | 'outcome'
  | 'scholarship'
  | 'cricos_ckan'
  | 'manual';

export type RefreshFrequency =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'manual';

export type DataSourceCrawlStatus = 'allowed' | 'denied' | 'indeterminate';

export interface IDataSource extends Document {
  name: string;
  type: DataSourceType;
  baseUrl: string;
  owner: string;
  licensingNotes?: string;
  sourcePriority: number; // 1 to 100 (higher = more authoritative)
  refreshFrequency: RefreshFrequency;
  freshnessSlaHours: number;
  lastSyncAt?: Date;
  lastSuccessfulSync?: Date;
  failureCount: number;
  coverage: string[]; // e.g. ['fees', 'cricos', 'intakes', 'requirements', 'programs']
  etag?: string;
  lastModified?: string;
  parserVersion: string;
  allowed: boolean;
  crawlStatus: DataSourceCrawlStatus;
  robotsNotes?: string;
  status: 'active' | 'inactive' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const DataSourceSchema = new Schema<IDataSource>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: [
        'official_api',
        'official_site',
        'ranking',
        'government',
        'outcome',
        'scholarship',
        'cricos_ckan',
        'manual',
      ],
      required: true,
    },
    baseUrl: { type: String, required: true, trim: true },
    owner: { type: String, required: true, default: 'Outvier Ingestion Team' },
    licensingNotes: { type: String },
    sourcePriority: { type: Number, required: true, default: 50, min: 1, max: 100 },
    refreshFrequency: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly', 'yearly', 'manual'],
      default: 'weekly',
    },
    freshnessSlaHours: { type: Number, required: true, default: 168 }, // 7 days default
    lastSyncAt: Date,
    lastSuccessfulSync: Date,
    failureCount: { type: Number, default: 0 },
    coverage: [{ type: String }],
    etag: String,
    lastModified: String,
    parserVersion: { type: String, required: true, default: '1.0.0' },
    allowed: { type: Boolean, default: true },
    crawlStatus: {
      type: String,
      enum: ['allowed', 'denied', 'indeterminate'],
      default: 'allowed',
    },
    robotsNotes: String,
    status: {
      type: String,
      enum: ['active', 'inactive', 'paused'],
      default: 'active',
    },
  },
  { timestamps: true }
);

DataSourceSchema.index({ type: 1, status: 1 });
DataSourceSchema.index({ sourcePriority: -1 });
DataSourceSchema.index({ lastSuccessfulSync: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);
