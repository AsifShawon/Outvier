import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IScholarship extends Document {
  universityId: Types.ObjectId;
  title: string;
  amount?: string;
  eligibility?: string;
  deadline?: string;
  sourceUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  fetchedAt?: Date;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ScholarshipSchema = new Schema<IScholarship>(
  {
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    title: { type: String, required: true, trim: true },
    amount: String,
    eligibility: String,
    deadline: String,
    sourceUrl: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    confidence: { type: Number, default: 0.8 },
    fetchedAt: Date,
    approvedAt: Date,
  },
  { timestamps: true }
);

ScholarshipSchema.index({ universityId: 1, status: 1 });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);
