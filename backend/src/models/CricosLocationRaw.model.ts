import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosLocationRaw extends Document {
  cricosProviderCode: string;
  institutionName: string;
  locationName: string;
  locationType: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city: string;
  state: string;
  postcode: string;
  raw: any;
  rawHash?: string;
  sourceResourceId: string;
  fetchedAt: Date;
  syncRunId?: mongoose.Types.ObjectId;
}

const CricosLocationRawSchema = new Schema<ICricosLocationRaw>(
  {
    cricosProviderCode: { type: String, required: true, index: true },
    institutionName: String,
    locationName: { type: String, required: true },
    locationType: String,
    addressLine1: { type: String, required: true },
    addressLine2: String,
    addressLine3: String,
    addressLine4: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    postcode: { type: String, required: true },
    raw: { type: Schema.Types.Mixed },
    rawHash: String,
    sourceResourceId: String,
    fetchedAt: { type: Date, default: Date.now },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
  },
  { timestamps: true }
);

CricosLocationRawSchema.index({ cricosProviderCode: 1, locationName: 1, addressLine1: 1, city: 1, postcode: 1 }, { unique: true });

export const CricosLocationRaw = mongoose.model<ICricosLocationRaw>('CricosLocationRaw', CricosLocationRawSchema);
