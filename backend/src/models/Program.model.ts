/**
 * Program.model.ts — significantly extended with AI ingestion fields.
 * All legacy fields preserved for backward compatibility.
 * New status values: 'draft' (AI-extracted, pending review), 'published' (admin approved), 'archived'.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDataQuality {
  confidence?: number;
  lastFetchedAt?: Date;
  lastApprovedAt?: Date;
  sourceUrl?: string;
  sourceName?: string;
  sourceResourceId?: string;
  importMethod?: 'cricos_api' | 'ai_ingestion' | 'manual' | 'csv';
}

// Per-field source evidence
export interface IFieldEvidence {
  value: string | number | boolean | null;
  sourceUrl: string;
  sourceType: 'CRICOS' | 'TEQSA' | 'UNIVERSITY_OFFICIAL' | 'FEE_PAGE' | 'REQUIREMENT_PAGE' | 'SCHOLARSHIP_PAGE' | 'GOVERNMENT' | 'SECONDARY';
  confidence: number;
  rawTextSnippet?: string;
  extractedAt?: Date;
}

// English requirement details
export interface IEnglishRequirements {
  ieltsOverall?: number;
  ieltsBandMin?: number;
  toefl?: number;
  pte?: number;
  duolingo?: number;
  notes?: string;
  sourceUrl?: string;
}

// Tuition details
export interface ITuitionDetails {
  annualTuitionFee?: number;
  totalEstimatedTuitionFee?: number;
  currency: string;
  feeYear?: string;
  applicationFee?: number;
  indicativeLivingCost?: number;
  additionalCosts?: Record<string, number>;
  sourceUrl?: string;
}

// Intake details
export interface IIntakeDetails {
  months?: string[];
  semesterAvailability?: string[];
  applicationDeadline?: string;
  internationalDeadline?: string;
  startDate?: string;
  nextAvailableIntake?: string;
}

// Scholarship info
export interface IScholarshipInfo {
  available: boolean;
  names?: string[];
  url?: string;
}

// Career outcomes
export interface ICareerOutcomes {
  opportunities?: string[];
  jobRoles?: string[];
  industryPathways?: string[];
  accreditation?: string[];
  professionalBodies?: string[];
  graduateOutcomeUrl?: string;
}

// Course structure
export interface ICourseStructure {
  creditPoints?: number;
  numberOfUnits?: number;
  coreCourses?: string[];
  electiveCourses?: string[];
  majors?: string[];
  hasInternship?: boolean;
  hasThesis?: boolean;
  notes?: string;
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
  // --- Existing new fields ---
  universityId?: Types.ObjectId;
  fieldOfStudy?: string;
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
    intake: string;
    deadline: string;
    notes?: string;
  }[];
  status: 'active' | 'inactive' | 'draft' | 'published' | 'archived';
  dataQuality?: IDataQuality;
  // --- AI Ingestion fields (new) ---
  degreeLevel?: string;
  faculty?: string;
  discipline?: string;
  programCode?: string;
  city?: string;
  state?: string;
  deliveryMode?: 'on-campus' | 'online' | 'hybrid';
  domesticAvailable?: boolean;
  internationalAvailable?: boolean;
  estimatedCompletionTime?: string;
  durationWeeks?: number;
  tuitionFeeAud?: number;
  nonTuitionFeeAud?: number;
  estimatedTotalCourseCostAud?: number;
  workComponent?: string;
  courseLanguage?: string;
  courseStructure?: ICourseStructure;
  academicEntryRequirements?: string;
  minimumGPA?: string;
  prerequisiteSubjects?: string[];
  englishRequirementsDetail?: IEnglishRequirements;
  portfolioRequired?: boolean;
  workExperienceRequired?: boolean;
  countrySpecificRequirements?: string;
  tuitionDetails?: ITuitionDetails;
  scholarshipInfo?: IScholarshipInfo;
  intakeDetails?: IIntakeDetails;
  careerOutcomes?: ICareerOutcomes;
  sourceUrls?: string[];
  sourceEvidence?: Record<string, IFieldEvidence>;
  confidenceScore?: number;
  missingFields?: string[];
  needsAdminReview?: boolean;
  dataSourceType?: string;
  extractedAt?: Date;
  lastCheckedAt?: Date;
  rawExtractedText?: string;
  aiSummary?: string;
  ingestionJobId?: Types.ObjectId;
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

const FieldEvidenceSchema = new Schema<IFieldEvidence>(
  {
    value: Schema.Types.Mixed,
    sourceUrl: String,
    sourceType: {
      type: String,
      enum: ['CRICOS', 'TEQSA', 'UNIVERSITY_OFFICIAL', 'FEE_PAGE', 'REQUIREMENT_PAGE', 'SCHOLARSHIP_PAGE', 'GOVERNMENT', 'SECONDARY'],
    },
    confidence: { type: Number, min: 0, max: 100 },
    rawTextSnippet: String,
    extractedAt: Date,
  },
  { _id: false }
);

const EnglishRequirementsSchema = new Schema<IEnglishRequirements>(
  {
    ieltsOverall: Number,
    ieltsBandMin: Number,
    toefl: Number,
    pte: Number,
    duolingo: Number,
    notes: String,
    sourceUrl: String,
  },
  { _id: false }
);

const TuitionDetailsSchema = new Schema<ITuitionDetails>(
  {
    annualTuitionFee: Number,
    totalEstimatedTuitionFee: Number,
    currency: { type: String, default: 'AUD' },
    feeYear: String,
    applicationFee: Number,
    indicativeLivingCost: Number,
    additionalCosts: { type: Map, of: Number },
    sourceUrl: String,
  },
  { _id: false }
);

const IntakeDetailsSchema = new Schema<IIntakeDetails>(
  {
    months: [String],
    semesterAvailability: [String],
    applicationDeadline: String,
    internationalDeadline: String,
    startDate: String,
    nextAvailableIntake: String,
  },
  { _id: false }
);

const ScholarshipInfoSchema = new Schema<IScholarshipInfo>(
  {
    available: { type: Boolean, default: false },
    names: [String],
    url: String,
  },
  { _id: false }
);

const CareerOutcomesSchema = new Schema<ICareerOutcomes>(
  {
    opportunities: [String],
    jobRoles: [String],
    industryPathways: [String],
    accreditation: [String],
    professionalBodies: [String],
    graduateOutcomeUrl: String,
  },
  { _id: false }
);

const CourseStructureSchema = new Schema<ICourseStructure>(
  {
    creditPoints: Number,
    numberOfUnits: Number,
    coreCourses: [String],
    electiveCourses: [String],
    majors: [String],
    hasInternship: Boolean,
    hasThesis: Boolean,
    notes: String,
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
    // Existing new
    fieldOfStudy: String,
    studyMode: String,
    campus: String,
    annualTuition: Number,
    totalEstimatedCost: Number,
    currency: { type: String, default: 'AUD' },
    ieltsRequirement: Number,
    pteRequirement: Number,
    academicRequirement: String,
    cricosCourseCode: { type: String, sparse: true, index: true },
    officialProgramUrl: { type: String, index: true },
    scholarshipAvailable: { type: Boolean, default: false },
    applicationDeadlines: [{
      intake: String,
      deadline: String,
      notes: String,
    }],
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'published', 'archived'],
      default: 'active',
      index: true,
    },
    dataQuality: DataQualitySchema,
    // CRICOS specific fields
    durationWeeks: Number,
    tuitionFeeAud: Number,
    nonTuitionFeeAud: Number,
    estimatedTotalCourseCostAud: Number,
    workComponent: String,
    courseLanguage: String,
    // AI Ingestion fields
    degreeLevel: String,
    faculty: String,
    discipline: String,
    programCode: String,
    city: String,
    state: String,
    deliveryMode: { type: String, enum: ['on-campus', 'online', 'hybrid'] },
    domesticAvailable: Boolean,
    internationalAvailable: Boolean,
    estimatedCompletionTime: String,
    courseStructure: CourseStructureSchema,
    academicEntryRequirements: String,
    minimumGPA: String,
    prerequisiteSubjects: [String],
    englishRequirementsDetail: EnglishRequirementsSchema,
    portfolioRequired: Boolean,
    workExperienceRequired: Boolean,
    countrySpecificRequirements: String,
    tuitionDetails: TuitionDetailsSchema,
    scholarshipInfo: ScholarshipInfoSchema,
    intakeDetails: IntakeDetailsSchema,
    careerOutcomes: CareerOutcomesSchema,
    sourceUrls: [String],
    sourceEvidence: { type: Map, of: FieldEvidenceSchema },
    confidenceScore: { type: Number, min: 0, max: 100, index: true },
    missingFields: [String],
    needsAdminReview: { type: Boolean, default: true, index: true },
    dataSourceType: String,
    extractedAt: Date,
    lastCheckedAt: Date,
    rawExtractedText: String,
    aiSummary: String,
    ingestionJobId: { type: Schema.Types.ObjectId, ref: 'IngestionJob', index: true },
  },
  { timestamps: true }
);

ProgramSchema.index({ name: 'text', description: 'text', field: 'text', fieldOfStudy: 'text', degreeLevel: 'text' });
ProgramSchema.index({ university: 1 });
ProgramSchema.index({ level: 1 });
ProgramSchema.index({ annualTuition: 1 });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
