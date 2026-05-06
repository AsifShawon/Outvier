import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgramLocation extends Document {
  university: Types.ObjectId;
  program: Types.ObjectId;
  campus: Types.ObjectId;
  cricosProviderCode: string;
  cricosCourseCode: string;
  locationName: string;
  locationCity?: string;
  locationState?: string;
  sourceMetadata?: {
    sourceName: string;
    sourceResourceId?: string;
    fetchedAt?: Date;
    lastApprovedAt?: Date;
  };
  status: 'active' | 'inactive' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const ProgramLocationSchema = new Schema<IProgramLocation>(
  {
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    campus: { type: Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    cricosProviderCode: { type: String, required: true },
    cricosCourseCode: { type: String, required: true },
    locationName: { type: String, required: true },
    locationCity: String,
    locationState: String,
    sourceMetadata: {
      sourceName: { type: String, default: 'CRICOS' },
      sourceResourceId: String,
      fetchedAt: Date,
      lastApprovedAt: Date,
    },
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

ProgramLocationSchema.index({ cricosProviderCode: 1, cricosCourseCode: 1, locationName: 1 }, { unique: true, sparse: true });

export const ProgramLocation = mongoose.model<IProgramLocation>('ProgramLocation', ProgramLocationSchema);
