import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosCourseLocationRaw extends Document {
  cricosProviderCode: string;
  institutionName: string;
  cricosCourseCode: string;
  courseName?: string;
  locationName: string;
  raw: any;
  sourceResourceId: string;
  sourceUpdatedAt?: Date;
  fetchedAt: Date;
  syncRunId?: mongoose.Types.ObjectId;
}

const CricosCourseLocationRawSchema = new Schema<ICricosCourseLocationRaw>(
  {
    cricosProviderCode: { type: String, required: true, index: true },
    institutionName: String,
    cricosCourseCode: { type: String, required: true, index: true },
    courseName: String,
    locationName: { type: String, required: true, index: true },
    raw: { type: Schema.Types.Mixed },
    sourceResourceId: String,
    sourceUpdatedAt: Date,
    fetchedAt: { type: Date, default: Date.now },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
  },
  { timestamps: true }
);

CricosCourseLocationRawSchema.index({ cricosProviderCode: 1, cricosCourseCode: 1, locationName: 1 }, { unique: true });

export const CricosCourseLocationRaw = mongoose.model<ICricosCourseLocationRaw>('CricosCourseLocationRaw', CricosCourseLocationRawSchema);
