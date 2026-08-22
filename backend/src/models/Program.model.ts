/**
 * Program.model.ts — Canonical Program Model.
 * Represents the abstract academic credential and curriculum definition.
 * All legacy fields preserved for backward compatibility during expand-migrate-contract.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export interface IDataQuality {
  confidence?: number;
  lastFetchedAt?: Date;
  lastApprovedAt?: Date;
  sourceUrl?: string;
  sourceName?: string;
  sourceResourceId?: string;
  importMethod?: 'cricos_api' | 'ai_ingestion' | 'manual' | 'csv' | 'connector';
}

export interface IStructuredDuration {
  durationYears?: number;
  durationSemesters?: number;
  durationWeeks?: number;
  durationText?: string;
}

export interface IFieldOfEducation {
  broadField?: string;
  narrowField?: string;
  detailedField?: string;
  broadCode?: string;
  narrowCode?: string;
  detailedCode?: string;
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

export type ProgramLevel =
  | 'bachelor'
  | 'master'
  | 'phd'
  | 'diploma'
  | 'certificate'
  | 'graduate_certificate'
  | 'secondary'
  | 'elicos'
  | 'non_award'
  | 'other';

export type ProgramStatus = 'active' | 'inactive' | 'draft' | 'published' | 'archived';

export interface IProgram extends Document {
  // --- Canonical Program Identity ---
  provider: Types.ObjectId; // Canonical ref to University
  university: Types.ObjectId; // Legacy alias to University
  providerName: string;
  providerSlug: string;
  name: string;
  slug: string;
  level: ProgramLevel;
  fieldOfStudy: string; // Canonical primary field of study (e.g. "Information Technology")
  discipline?: string; // Sub-discipline (e.g. "Artificial Intelligence")
  fieldOfEducation?: IFieldOfEducation;
  programCode?: string; // Institution internal code (e.g. "3778")
  description: string;
  faculty?: string;
  durationStructure?: IStructuredDuration;
  courseStructure?: ICourseStructure;
  careerPathways?: string[];
  status: ProgramStatus;

  // --- Provenance & Source Evidence ---
  dataQuality?: IDataQuality;
  sourceEvidence?: Map<string, IFieldEvidence> | Record<string, IFieldEvidence>;
  provenance?: IFieldEvidence;
  sourceUrls?: string[];
  confidenceScore?: number;
  missingFields?: string[];
  needsAdminReview?: boolean;
  dataSourceType?: string;
  extractedAt?: Date;
  lastCheckedAt?: Date;
  rawExtractedText?: string;
  aiSummary?: string;
  ingestionJobId?: Types.ObjectId;

  // --- Denormalized / Derived Summary Fields ---
  primaryFeeAnnualAud?: number; // Canonical annual international fee in AUD for instant search/sort
  primaryFeeTotalAud?: number; // Canonical total estimated course fee in AUD
  availableStudyModes?: ('on-campus' | 'online' | 'hybrid' | 'external')[];
  availableCampusCities?: string[];
  activeIntakeCount?: number;

  // --- Legacy fields preserved for backward compatibility ---
  field?: string; // @deprecated: use fieldOfStudy
  universityName?: string;
  universitySlug?: string;
  universityId?: Types.ObjectId;
  duration?: string; // @deprecated: string duration, prefer durationStructure
  tuitionFeeLocal?: number; // @deprecated: prefer FeeObservation
  tuitionFeeInternational?: number; // @deprecated: prefer FeeObservation / primaryFeeAnnualAud
  annualTuition?: number; // @deprecated: prefer FeeObservation / primaryFeeAnnualAud
  totalEstimatedCost?: number; // @deprecated: prefer FeeObservation / primaryFeeTotalAud
  intakeMonths?: string[]; // @deprecated: prefer Intake collection / offerings
  englishRequirements?: string; // @deprecated: prefer EnglishRequirement
  academicRequirements?: string; // @deprecated: prefer EntryRequirement
  academicRequirement?: string;
  campusMode?: 'on-campus' | 'online' | 'hybrid'; // @deprecated: prefer ProgramOffering.studyMode
  website?: string; // @deprecated: prefer officialProgramUrl
  city?: string;
  state?: string;
  campus?: string;
  currency?: string;
  ieltsRequirement?: number;
  pteRequirement?: number;
  cricosCourseCode?: string;
  cricosProviderCode?: string;
  institutionName?: string;
  courseLevel?: string;
  vetNationalCode?: string;
  dualQualification?: boolean;
  foundationStudies?: boolean;
  fieldOfEducation1BroadField?: string;
  fieldOfEducation1NarrowField?: string;
  fieldOfEducation1DetailedField?: string;
  fieldOfEducation2BroadField?: string;
  fieldOfEducation2NarrowField?: string;
  fieldOfEducation2DetailedField?: string;
  expired?: boolean;
  lastCricosSyncedAt?: Date;
  cricosDataHash?: string;
  durationWeeks?: number;
  tuitionFeeAud?: number;
  nonTuitionFeeAud?: number;
  estimatedTotalCourseCostAud?: number;
  workComponent?: string;
  courseLanguage?: string;
  officialProgramUrl?: string;
  scholarshipAvailable?: boolean;
  applicationDeadlines?: {
    intake: string;
    deadline: string;
    notes?: string;
  }[];
  degreeLevel?: string;
  deliveryMode?: 'on-campus' | 'online' | 'hybrid';
  domesticAvailable?: boolean;
  internationalAvailable?: boolean;
  estimatedCompletionTime?: string;
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

  createdAt: Date;
  updatedAt: Date;
}

const DataQualitySchema = new Schema<IDataQuality>(
  {
    confidence: Number,
    lastFetchedAt: Date,
    lastApprovedAt: Date,
    sourceUrl: String,
    sourceName: String,
    sourceResourceId: String,
    importMethod: { type: String, enum: ['cricos_api', 'ai_ingestion', 'manual', 'csv', 'connector'] },
  },
  { _id: false }
);

const StructuredDurationSchema = new Schema<IStructuredDuration>(
  {
    durationYears: Number,
    durationSemesters: Number,
    durationWeeks: Number,
    durationText: String,
  },
  { _id: false }
);

const FieldOfEducationSchema = new Schema<IFieldOfEducation>(
  {
    broadField: String,
    narrowField: String,
    detailedField: String,
    broadCode: String,
    narrowCode: String,
    detailedCode: String,
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
    // Canonical Properties
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    providerName: { type: String, required: true },
    providerSlug: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, index: true },
    level: {
      type: String,
      enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate', 'secondary', 'elicos', 'non_award', 'other'],
      required: true,
      index: true,
    },
    fieldOfStudy: { type: String, required: true, index: true },
    discipline: { type: String, index: true },
    fieldOfEducation: FieldOfEducationSchema,
    programCode: { type: String, trim: true },
    description: { type: String, default: '' },
    faculty: String,
    durationStructure: StructuredDurationSchema,
    courseStructure: CourseStructureSchema,
    careerPathways: [String],
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'published', 'archived'],
      default: 'active',
      index: true,
    },

    // Provenance & Source Evidence
    dataQuality: DataQualitySchema,
    sourceEvidence: { type: Map, of: FieldEvidenceSchema },
    provenance: FieldEvidenceSchema,
    sourceUrls: [String],
    confidenceScore: { type: Number, min: 0, max: 100, index: true },
    missingFields: [String],
    needsAdminReview: { type: Boolean, default: false, index: true },
    dataSourceType: String,
    extractedAt: Date,
    lastCheckedAt: Date,
    rawExtractedText: String,
    aiSummary: String,
    ingestionJobId: { type: Schema.Types.ObjectId, ref: 'IngestionJob', index: true },

    // Denormalized / Derived Summary Fields
    primaryFeeAnnualAud: { type: Number, index: true },
    primaryFeeTotalAud: { type: Number, index: true },
    availableStudyModes: [{ type: String, enum: ['on-campus', 'online', 'hybrid', 'external'] }],
    availableCampusCities: [String],
    activeIntakeCount: { type: Number, default: 0 },

    // Legacy fields preserved for backward compatibility
    field: { type: String }, // @deprecated: alias for fieldOfStudy
    universityName: { type: String },
    universitySlug: { type: String },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    duration: String,
    tuitionFeeLocal: Number,
    tuitionFeeInternational: Number,
    annualTuition: Number,
    totalEstimatedCost: Number,
    currency: { type: String, default: 'AUD' },
    intakeMonths: [String],
    englishRequirements: String,
    academicRequirements: String,
    academicRequirement: String,
    campusMode: { type: String, enum: ['on-campus', 'online', 'hybrid'], default: 'on-campus' },
    website: String,
    city: String,
    state: String,
    campus: String,
    ieltsRequirement: Number,
    pteRequirement: Number,
    cricosCourseCode: { type: String, sparse: true, index: true },
    cricosProviderCode: { type: String, trim: true, index: true },
    institutionName: { type: String, trim: true },
    courseLevel: { type: String, trim: true },
    vetNationalCode: { type: String, trim: true },
    dualQualification: { type: Boolean },
    foundationStudies: { type: Boolean },
    fieldOfEducation1BroadField: String,
    fieldOfEducation1NarrowField: String,
    fieldOfEducation1DetailedField: String,
    fieldOfEducation2BroadField: String,
    fieldOfEducation2NarrowField: String,
    fieldOfEducation2DetailedField: String,
    expired: { type: Boolean, default: false, index: true },
    lastCricosSyncedAt: Date,
    cricosDataHash: String,
    durationWeeks: Number,
    tuitionFeeAud: Number,
    nonTuitionFeeAud: Number,
    estimatedTotalCourseCostAud: { type: Number, index: true },
    workComponent: String,
    courseLanguage: String,
    officialProgramUrl: { type: String, index: true },
    scholarshipAvailable: { type: Boolean, default: false },
    applicationDeadlines: [{
      intake: String,
      deadline: String,
      notes: String,
    }],
    degreeLevel: String,
    deliveryMode: { type: String, enum: ['on-campus', 'online', 'hybrid'] },
    domesticAvailable: Boolean,
    internationalAvailable: Boolean,
    estimatedCompletionTime: String,
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
  },
  { timestamps: true }
);

// Pre-save synchronization hook
ProgramSchema.pre('save', function (next) {
  // Sync provider <-> university
  if (this.provider && !this.university) {
    this.university = this.provider;
  } else if (this.university && !this.provider) {
    this.provider = this.university;
  }

  // Sync field <-> fieldOfStudy
  if (this.fieldOfStudy && !this.field) {
    this.field = this.fieldOfStudy;
  } else if (this.field && !this.fieldOfStudy) {
    this.fieldOfStudy = this.field;
  }

  // Sync providerName <-> universityName
  if (this.providerName && !this.universityName) {
    this.universityName = this.providerName;
  } else if (this.universityName && !this.providerName) {
    this.providerName = this.universityName;
  }

  // Sync providerSlug <-> universitySlug
  if (this.providerSlug && !this.universitySlug) {
    this.universitySlug = this.providerSlug;
  } else if (this.universitySlug && !this.providerSlug) {
    this.providerSlug = this.universitySlug;
  }

  // Sync primary fees if not set
  if (this.primaryFeeAnnualAud === undefined) {
    this.primaryFeeAnnualAud = this.annualTuition || this.tuitionFeeAud || this.tuitionFeeInternational || this.tuitionDetails?.annualTuitionFee;
  }
  if (this.primaryFeeTotalAud === undefined) {
    this.primaryFeeTotalAud = this.totalEstimatedCost || this.estimatedTotalCourseCostAud || this.tuitionDetails?.totalEstimatedTuitionFee;
  }

  next();
});

// Full-text index and compound search indexes
ProgramSchema.index({ name: 'text', description: 'text', fieldOfStudy: 'text', discipline: 'text', degreeLevel: 'text' });
ProgramSchema.index({ provider: 1, status: 1 });
ProgramSchema.index({ level: 1, fieldOfStudy: 1, status: 1 });
ProgramSchema.index({ primaryFeeAnnualAud: 1, status: 1 });
ProgramSchema.index({ cricosProviderCode: 1, cricosCourseCode: 1 }, { unique: true, sparse: true });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
