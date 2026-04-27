import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRankingRecord extends Document {
  universityId: Types.ObjectId;
  source: 'QS' | 'THE' | 'ARWU' | 'Manual' | 'Other';
  year: number;
  globalRank?: number;
  nationalRank?: number;
  subject?: string;
  subjectRank?: number;
  sourceUrl?: string;
  fetchedAt?: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const RankingRecordSchema = new Schema<IRankingRecord>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    source: { type: String, enum: ['QS', 'THE', 'ARWU', 'Manual', 'Other'], required: true },
    year: { type: Number, required: true },
    globalRank: Number,
    nationalRank: Number,
    subject: String,
    subjectRank: Number,
    sourceUrl: String,
    fetchedAt: Date,
    approvedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    confidence: { type: Number, default: 0.8 },
  },
  { timestamps: true }
);

RankingRecordSchema.index({ universityId: 1, source: 1, year: 1 }, { unique: true });

export const RankingRecord = mongoose.model<IRankingRecord>('RankingRecord', RankingRecordSchema);
