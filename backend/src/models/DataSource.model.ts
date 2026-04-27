import mongoose, { Document, Schema } from 'mongoose';

export interface IDataSource extends Document {
  name: string;
  type: 'official_site' | 'ranking' | 'government' | 'outcome' | 'scholarship' | 'manual';
  baseUrl: string;
  allowed: boolean;
  robotsNotes?: string;
  refreshFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'manual';
  lastSyncAt?: Date;
  status: 'active' | 'inactive' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

const DataSourceSchema = new Schema<IDataSource>(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['official_site', 'ranking', 'government', 'outcome', 'scholarship', 'manual'],
      required: true,
    },
    baseUrl: { type: String, required: true },
    allowed: { type: Boolean, default: true },
    robotsNotes: String,
    refreshFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'manual'],
      default: 'weekly',
    },
    lastSyncAt: Date,
    status: { type: String, enum: ['active', 'inactive', 'paused'], default: 'active' },
  },
  { timestamps: true }
);

DataSourceSchema.index({ type: 1, status: 1 });

export const DataSource = mongoose.model<IDataSource>('DataSource', DataSourceSchema);
