import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosInstitutionRaw extends Document {
  cricosProviderCode: string;
  tradingName: string;
  institutionName: string;
  institutionType: string;
  institutionCapacity: number;
  website?: string;
  postalAddressLine1?: string;
  postalAddressLine2?: string;
  postalAddressLine3?: string;
  postalAddressLine4?: string;
  postalAddressCity?: string;
  postalAddressState?: string;
  postalAddressPostcode?: string;
  raw: any;
  rawHash?: string;
  sourceResourceId: string;
  fetchedAt: Date;
  syncRunId?: mongoose.Types.ObjectId;
}

const CricosInstitutionRawSchema = new Schema<ICricosInstitutionRaw>(
  {
    cricosProviderCode: { type: String, required: true, unique: true, index: true },
    tradingName: String,
    institutionName: { type: String, required: true },
    institutionType: String,
    institutionCapacity: Number,
    website: String,
    postalAddressLine1: String,
    postalAddressLine2: String,
    postalAddressLine3: String,
    postalAddressLine4: String,
    postalAddressCity: String,
    postalAddressState: String,
    postalAddressPostcode: String,
    raw: { type: Schema.Types.Mixed },
    rawHash: String,
    sourceResourceId: String,
    fetchedAt: { type: Date, default: Date.now },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
  },
  { timestamps: true }
);

export const CricosInstitutionRaw = mongoose.model<ICricosInstitutionRaw>('CricosInstitutionRaw', CricosInstitutionRawSchema);
