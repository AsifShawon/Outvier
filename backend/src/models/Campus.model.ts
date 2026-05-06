import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICampus extends Document {
  university: Types.ObjectId;
  cricosProviderCode: string;
  institutionName?: string;
  name: string;
  locationType?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city: string;
  state: string;
  postcode: string;
  fullAddress?: string;
  sourceMetadata?: {
    sourceName: string;
    sourceResourceId?: string;
    sourceUrl?: string;
    fetchedAt?: Date;
    lastApprovedAt?: Date;
    confidence: number;
    importMethod?: 'cricos_api' | 'manual';
  };
  status: 'active' | 'inactive' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CampusSchema = new Schema<ICampus>(
  {
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    cricosProviderCode: { type: String, required: true, index: true },
    institutionName: String,
    name: { type: String, required: true, trim: true },
    locationType: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    addressLine3: String,
    addressLine4: String,
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    postcode: { type: String, required: true },
    fullAddress: String,
    sourceMetadata: {
      sourceName: { type: String, default: 'CRICOS' },
      sourceResourceId: String,
      sourceUrl: String,
      fetchedAt: Date,
      lastApprovedAt: Date,
      confidence: { type: Number, default: 1 },
      importMethod: { type: String, enum: ['cricos_api', 'manual'] },
    },
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived'], default: 'active' },
  },
  { timestamps: true }
);

CampusSchema.index({ cricosProviderCode: 1, name: 1, city: 1, postcode: 1 }, { unique: true, sparse: true });

export const Campus = mongoose.model<ICampus>('Campus', CampusSchema);
