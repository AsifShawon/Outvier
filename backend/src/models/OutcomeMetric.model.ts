import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOutcomeMetric extends Document {
  universityId: Types.ObjectId;
  programId?: Types.ObjectId;
  source: 'QILT' | 'ComparED' | 'Manual' | 'Other';
  year: number;
  teachingQuality?: number;
  studentSupport?: number;
  learnerEngagement?: number;
  overallExperience?: number;
  graduateEmploymentRate?: number;
  medianSalary?: number;
  sourceUrl?: string;
  fetchedAt?: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
}

const OutcomeMetricSchema = new Schema<IOutcomeMetric>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    source: { type: String, enum: ['QILT', 'ComparED', 'Manual', 'Other'], required: true },
    year: { type: Number, required: true },
    teachingQuality: Number,
    studentSupport: Number,
    learnerEngagement: Number,
    overallExperience: Number,
    graduateEmploymentRate: Number,
    medianSalary: Number,
    sourceUrl: String,
    fetchedAt: Date,
    approvedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    confidence: { type: Number, default: 0.8 },
  },
  { timestamps: true }
);

OutcomeMetricSchema.index({ universityId: 1, source: 1, year: 1 });

export const OutcomeMetric = mongoose.model<IOutcomeMetric>('OutcomeMetric', OutcomeMetricSchema);
