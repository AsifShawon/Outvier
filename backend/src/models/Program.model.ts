import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDataQuality {
  confidence?: number;
  lastFetchedAt?: Date;
  lastApprovedAt?: Date;
  sourceUrl?: string;
}

export interface IProgram extends Document {
  // --- Legacy fields kept for backward compat ---
  name: string;
  slug: string;
  university: Types.ObjectId;
  universityName: string;
  universitySlug: string;
  level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate' | 'graduate_certificate';
  field: string;
  description: string;
  duration: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: 'on-campus' | 'online' | 'hybrid';
  website?: string;
  // --- New fields ---
  universityId?: Types.ObjectId;   // alias for university
  fieldOfStudy?: string;           // alias for field
  studyMode?: string;
  campus?: string;
  annualTuition?: number;
  totalEstimatedCost?: number;
  currency?: string;
  ieltsRequirement?: number;
  pteRequirement?: number;
  academicRequirement?: string;
  cricosCourseCode?: string;
  officialProgramUrl?: string;
  scholarshipAvailable?: boolean;
  applicationDeadlines?: {
    intake: string;      // e.g. "February 2025"
    deadline: string;    // e.g. "November 30, 2024"
    notes?: string;
  }[];
  status: 'active' | 'inactive' | 'draft';
  dataQuality?: IDataQuality;
  createdAt: Date;
  updatedAt: Date;
}

const DataQualitySchema = new Schema<IDataQuality>(
  {
    confidence: Number,
    lastFetchedAt: Date,
    lastApprovedAt: Date,
    sourceUrl: String,
  },
  { _id: false }
);

const ProgramSchema = new Schema<IProgram>(
  {
    // Legacy
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    universityName: { type: String, required: true },
    universitySlug: { type: String, required: true },
    level: {
      type: String,
      enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate'],
      required: true,
    },
    field: { type: String, required: true },
    description: { type: String },
    duration: { type: String },
    tuitionFeeLocal: Number,
    tuitionFeeInternational: Number,
    intakeMonths: [String],
    englishRequirements: String,
    academicRequirements: String,
    careerPathways: [String],
    campusMode: { type: String, enum: ['on-campus', 'online', 'hybrid'], default: 'on-campus' },
    website: String,
    // New
    fieldOfStudy: String,
    studyMode: String,
    campus: String,
    annualTuition: Number,
    totalEstimatedCost: Number,
    currency: { type: String, default: 'AUD' },
    ieltsRequirement: Number,
    pteRequirement: Number,
    academicRequirement: String,
    cricosCourseCode: { type: String, sparse: true },
    officialProgramUrl: String,
    scholarshipAvailable: { type: Boolean, default: false },
    applicationDeadlines: [{
      intake: String,
      deadline: String,
      notes: String,
    }],
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
    dataQuality: DataQualitySchema,
  },
  { timestamps: true }
);

ProgramSchema.index({ name: 'text', description: 'text', field: 'text', fieldOfStudy: 'text' });
ProgramSchema.index({ university: 1 });
ProgramSchema.index({ level: 1 });
ProgramSchema.index({ annualTuition: 1 });
ProgramSchema.index({ status: 1 });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
