import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosCourseRaw extends Document {
  cricosProviderCode: string;
  institutionName: string;
  cricosCourseCode: string;
  courseName: string;
  vetNationalCode?: string;
  dualQualification?: string;
  fieldOfEducationBroad?: string;
  fieldOfEducationNarrow?: string;
  courseLevel?: string;
  foundationStudies?: string;
  workComponent?: string;
  courseLanguage?: string;
  durationWeeks?: number;
  tuitionFee?: number;
  nonTuitionFee?: number;
  estimatedTotalCourseCost?: number;
  raw: any;
  sourceResourceId: string;
  sourceUpdatedAt?: Date;
  fetchedAt: Date;
  syncRunId?: mongoose.Types.ObjectId;
}

const CricosCourseRawSchema = new Schema<ICricosCourseRaw>(
  {
    cricosProviderCode: { type: String, required: true, index: true },
    institutionName: String,
    cricosCourseCode: { type: String, required: true, index: true },
    courseName: { type: String, required: true },
    vetNationalCode: String,
    dualQualification: String,
    fieldOfEducationBroad: String,
    fieldOfEducationNarrow: String,
    courseLevel: String,
    foundationStudies: String,
    workComponent: String,
    courseLanguage: String,
    durationWeeks: Number,
    tuitionFee: Number,
    nonTuitionFee: Number,
    estimatedTotalCourseCost: Number,
    raw: { type: Schema.Types.Mixed },
    sourceResourceId: String,
    sourceUpdatedAt: Date,
    fetchedAt: { type: Date, default: Date.now },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
  },
  { timestamps: true }
);

CricosCourseRawSchema.index({ cricosCourseCode: 1, cricosProviderCode: 1 }, { unique: true });

export const CricosCourseRaw = mongoose.model<ICricosCourseRaw>('CricosCourseRaw', CricosCourseRawSchema);
