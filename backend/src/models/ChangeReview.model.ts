/**
 * ChangeReview.model.ts — Canonical Change Review Model.
 * Provides staging, provenance validation, conflict detection, and human-in-the-loop review.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type CanonicalEntityType =
  | 'University'
  | 'Campus'
  | 'Program'
  | 'ProgramOffering'
  | 'Intake'
  | 'FeeObservation'
  | 'EntryRequirement'
  | 'EnglishRequirement'
  | 'Scholarship'
  | 'RankingObservation'
  | 'OutcomeMetric'
  | 'university'
  | 'program'
  | 'campus'
  | 'ranking'
  | 'tuition'
  | 'outcome'
  | 'scholarship'
  | 'programLocation'
  | 'cricosRaw'
  | 'cricosInstitution'
  | 'cricosCourse'
  | 'cricosLocation'
  | 'cricosCourseLocation';

export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'edited' | 'conflicted';
export type ChangeOperation = 'create' | 'update' | 'delete' | 'possible_duplicate';

export interface IChangeWarning {
  field: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface IChangeReview extends Document {
  entityType: CanonicalEntityType;
  entityId?: Types.ObjectId;
  providerId?: Types.ObjectId;
  programId?: Types.ObjectId;
  changeType: ChangeOperation;
  oldValue?: Record<string, unknown>;
  newValue: Record<string, unknown>;
  diff?: Record<string, { old: unknown; new: unknown }>;
  diffSummary?: string;
  sourceUrl?: string;
  sourceUrls?: string[];
  confidence: number;
  confidenceScore?: number;
  sourceEvidence?: Record<string, IFieldEvidence> | Map<string, IFieldEvidence>;
  warnings?: IChangeWarning[];
  missingFields?: string[];
  aiSummary?: string;
  ingestionJobId?: Types.ObjectId;
  syncRunId?: Types.ObjectId;
  externalKey?: string;
  rawHash?: string;
  autoApprovalEligible?: boolean;
  status: ReviewStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChangeWarningSchema = new Schema<IChangeWarning>(
  {
    field: String,
    message: String,
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  { _id: false }
);

const ChangeReviewSchema = new Schema<IChangeReview>(
  {
    entityType: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId, index: true },
    providerId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    changeType: {
      type: String,
      enum: ['create', 'update', 'delete', 'possible_duplicate'],
      required: true,
    },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed, required: true },
    diff: { type: Schema.Types.Mixed },
    diffSummary: String,
    sourceUrl: String,
    sourceUrls: [String],
    confidence: { type: Number, required: true, min: 0, max: 1, default: 0.9 },
    confidenceScore: { type: Number, min: 0, max: 100 },
    sourceEvidence: { type: Schema.Types.Mixed },
    warnings: [ChangeWarningSchema],
    missingFields: [String],
    aiSummary: String,
    ingestionJobId: { type: Schema.Types.ObjectId, ref: 'IngestionJob', index: true },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun', index: true },
    externalKey: { type: String, index: true },
    rawHash: String,
    autoApprovalEligible: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'edited', 'conflicted'],
      default: 'pending',
      index: true,
    },
    reviewedBy: String,
    reviewedAt: Date,
    reviewNotes: String,
  },
  { timestamps: true }
);

ChangeReviewSchema.index({ status: 1, createdAt: -1 });
ChangeReviewSchema.index({ entityType: 1, status: 1 });
ChangeReviewSchema.index({ providerId: 1, status: 1 });

export const ChangeReview = mongoose.model<IChangeReview>('ChangeReview', ChangeReviewSchema);
