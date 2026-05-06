import mongoose, { Document, Schema } from 'mongoose';

export interface ICricosCourseRaw extends Document {
  cricosProviderCode: string;
  institutionName: string;
  cricosCourseCode: string;
  courseName: string;
  vetNationalCode?: string;
  dualQualification?: string;
  fieldOfEducation1BroadField?: string;
  fieldOfEducation1NarrowField?: string;
  fieldOfEducation1DetailedField?: string;
  fieldOfEducation2BroadField?: string;
  fieldOfEducation2NarrowField?: string;
  fieldOfEducation2DetailedField?: string;
  courseLevel?: string;
  foundationStudies?: string;
  workComponent?: string;
  workComponentHoursPerWeek?: number;
  workComponentWeeks?: number;
  workComponentTotalHours?: number;
  courseLanguage?: string;
  durationWeeks?: number;
  tuitionFee?: number;
  nonTuitionFee?: number;
  estimatedTotalCourseCost?: number;
  expired?: boolean;
  raw: any;
  rawHash?: string;
  sourceResourceId: string;
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
    fieldOfEducation1BroadField: String,
    fieldOfEducation1NarrowField: String,
    fieldOfEducation1DetailedField: String,
    fieldOfEducation2BroadField: String,
    fieldOfEducation2NarrowField: String,
    fieldOfEducation2DetailedField: String,
    courseLevel: String,
    foundationStudies: String,
    workComponent: String,
    workComponentHoursPerWeek: Number,
    workComponentWeeks: Number,
    workComponentTotalHours: Number,
    courseLanguage: String,
    durationWeeks: Number,
    tuitionFee: Number,
    nonTuitionFee: Number,
    estimatedTotalCourseCost: Number,
    expired: { type: Boolean, default: false },
    raw: { type: Schema.Types.Mixed },
    rawHash: String,
    sourceResourceId: String,
    fetchedAt: { type: Date, default: Date.now },
    syncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
  },
  { timestamps: true }
);

CricosCourseRawSchema.index({ cricosCourseCode: 1, cricosProviderCode: 1 }, { unique: true });

export const CricosCourseRaw = mongoose.model<ICricosCourseRaw>('CricosCourseRaw', CricosCourseRawSchema);
