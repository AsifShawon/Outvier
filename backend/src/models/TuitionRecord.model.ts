import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITuitionRecord extends Document {
  universityId: Types.ObjectId;
  programId?: Types.ObjectId;
  year: number;
  annualTuition?: number;
  totalTuition?: number;
  currency: string;
  sourceUrl?: string;
  fetchedAt?: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TuitionRecordSchema = new Schema<ITuitionRecord>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    year: { type: Number, required: true },
    annualTuition: Number,
    totalTuition: Number,
    currency: { type: String, default: 'AUD' },
    sourceUrl: String,
    fetchedAt: Date,
    approvedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    confidence: { type: Number, default: 0.8 },
  },
  { timestamps: true }
);

TuitionRecordSchema.index({ programId: 1, year: 1 });

export const TuitionRecord = mongoose.model<ITuitionRecord>('TuitionRecord', TuitionRecordSchema);
