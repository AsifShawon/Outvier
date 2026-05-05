/**
 * StagedChange.model.ts — extended with AI ingestion metadata.
 * All legacy fields preserved for backward compatibility.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

export type EntityType = 'university' | 'program' | 'ranking' | 'tuition' | 'outcome' | 'scholarship';
export type ChangeType = 'create' | 'update' | 'delete' | 'possible_duplicate';
export type StagedChangeStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface IStagedChangeWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IStagedChange extends Document {
  entityType: EntityType;
  entityId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  programId?: Types.ObjectId;
  changeType: ChangeType;
  oldValue?: Record<string, unknown>;
  newValue: Record<string, unknown>;
  diff?: Record<string, { old: unknown; new: unknown }>; // per-field diff
  sourceUrl?: string;
  sourceUrls?: string[];           // multiple source URLs
  confidence: number;
  confidenceScore?: number;        // 0-100 alias
  sourceEvidence?: Record<string, unknown>; // per-field evidence map
  warnings?: IStagedChangeWarning[];
  missingFields?: string[];
  aiSummary?: string;
  ingestionJobId?: Types.ObjectId; // link to IngestionJob
  status: StagedChangeStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StagedChangeWarningSchema = new Schema<IStagedChangeWarning>(
  {
    field: String,
    message: String,
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { _id: false }
);

const StagedChangeSchema = new Schema<IStagedChange>(
  {
    entityType: {
      type: String,
      enum: ['university', 'program', 'ranking', 'tuition', 'outcome', 'scholarship'],
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    changeType: {
      type: String,
      enum: ['create', 'update', 'delete', 'possible_duplicate'],
      required: true,
    },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed, required: true },
    diff: { type: Schema.Types.Mixed },
    sourceUrl: String,
    sourceUrls: [{ type: String }],
    confidence: { type: Number, required: true, min: 0, max: 1 },
    confidenceScore: { type: Number, min: 0, max: 100, index: true },
    sourceEvidence: { type: Schema.Types.Mixed },
    warnings: [StagedChangeWarningSchema],
    missingFields: [{ type: String }],
    aiSummary: String,
    ingestionJobId: { type: Schema.Types.ObjectId, ref: 'IngestionJob', index: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'edited'],
      default: 'pending',
    },
    reviewedBy: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

StagedChangeSchema.index({ status: 1, createdAt: -1 });
StagedChangeSchema.index({ entityType: 1, status: 1 });
StagedChangeSchema.index({ universityId: 1, status: 1 });

export const StagedChange = mongoose.model<IStagedChange>('StagedChange', StagedChangeSchema);
