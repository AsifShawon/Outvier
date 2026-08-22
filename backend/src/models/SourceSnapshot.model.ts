import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISourceSnapshot extends Document {
  dataSourceId?: Types.ObjectId;
  entityType: 'University' | 'Program' | 'Campus' | 'ProgramOffering' | 'FeeObservation' | 'RankingObservation' | 'OutcomeMetric' | 'Scholarship' | 'General';
  entityId?: Types.ObjectId;
  sourceUrl: string;
  sourceType: string;
  snapshotHash: string; // SHA-256 hash of raw content
  mimeType: string;
  rawPayload: string; // HTML, JSON, or CSV raw text
  parserVersion: string;
  httpStatus?: number;
  contentLengthBytes?: number;
  fetchedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const SourceSnapshotSchema = new Schema<ISourceSnapshot>(
  {
    dataSourceId: { type: Schema.Types.ObjectId, ref: 'DataSource', index: true },
    entityType: {
      type: String,
      enum: ['University', 'Program', 'Campus', 'ProgramOffering', 'FeeObservation', 'RankingObservation', 'OutcomeMetric', 'Scholarship', 'General'],
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, index: true },
    sourceUrl: { type: String, required: true, trim: true, index: true },
    sourceType: { type: String, required: true, default: 'UNIVERSITY_OFFICIAL' },
    snapshotHash: { type: String, required: true, index: true },
    mimeType: { type: String, default: 'text/html' },
    rawPayload: { type: String, required: true },
    parserVersion: { type: String, required: true, default: '1.0.0' },
    httpStatus: { type: Number, default: 200 },
    contentLengthBytes: { type: Number },
    fetchedAt: { type: Date, required: true, default: Date.now, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

SourceSnapshotSchema.index({ sourceUrl: 1, snapshotHash: 1 });
SourceSnapshotSchema.index({ entityType: 1, entityId: 1 });

export const SourceSnapshot = mongoose.model<ISourceSnapshot>('SourceSnapshot', SourceSnapshotSchema);
