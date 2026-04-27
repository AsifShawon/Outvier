import mongoose, { Document, Schema, Types } from 'mongoose';

export type EntityType = 'university' | 'program' | 'ranking' | 'tuition' | 'outcome' | 'scholarship';
export type ChangeType = 'create' | 'update' | 'delete' | 'possible_duplicate';
export type StagedChangeStatus = 'pending' | 'approved' | 'rejected' | 'edited';

export interface IStagedChange extends Document {
  entityType: EntityType;
  entityId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  programId?: Types.ObjectId;
  changeType: ChangeType;
  oldValue?: Record<string, unknown>;
  newValue: Record<string, unknown>;
  sourceUrl?: string;
  confidence: number;
  status: StagedChangeStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
    sourceUrl: String,
    confidence: { type: Number, required: true, min: 0, max: 1 },
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
