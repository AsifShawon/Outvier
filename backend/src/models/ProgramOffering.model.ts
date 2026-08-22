/**
 * ProgramOffering.model.ts — Canonical Program Offering Model.
 * Connects: program, provider, campus, study mode, CRICOS code/status, intakes, availability.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type StudyMode = 'on-campus' | 'online' | 'hybrid' | 'external';
export type AttendanceType = 'full-time' | 'part-time' | 'both';
export type CricosStatus = 'registered' | 'expired' | 'suspended' | 'exempt' | 'not_applicable';
export type AvailabilityStatus = 'open' | 'closed' | 'waitlist' | 'discontinued';
export type OfferingStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface IOfferingIntakeSummary {
  intakeId?: Types.ObjectId;
  academicYear: number;
  term: string;
  startDate?: Date;
  censusDate?: Date;
  applicationDeadlineDomestic?: Date;
  applicationDeadlineInternational?: Date;
  timezone?: string;
  status: 'open' | 'closed' | 'upcoming' | 'cancelled';
}

export interface IProgramOffering extends Document {
  program: Types.ObjectId; // Ref to Program
  provider: Types.ObjectId; // Ref to University
  campus: Types.ObjectId; // Ref to Campus
  studyMode: StudyMode;
  attendanceType: AttendanceType;
  cricosCourseCode?: string;
  cricosStatus: CricosStatus;
  domesticAvailable: boolean;
  internationalAvailable: boolean;
  availabilityStatus: AvailabilityStatus;
  status: OfferingStatus;
  intakes?: IOfferingIntakeSummary[];
  entryRequirements?: Types.ObjectId; // Ref to EntryRequirement
  englishRequirements?: Types.ObjectId; // Ref to EnglishRequirement
  primaryAnnualFeeAud?: number;
  primaryTotalFeeAud?: number;
  sourceEvidence?: Map<string, IFieldEvidence> | Record<string, IFieldEvidence>;
  provenance?: IFieldEvidence;
  sourceMetadata?: {
    sourceName?: string;
    sourceResourceId?: string;
    sourceUrl?: string;
    fetchedAt?: Date;
    lastApprovedAt?: Date;
    confidence?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OfferingIntakeSummarySchema = new Schema<IOfferingIntakeSummary>(
  {
    intakeId: { type: Schema.Types.ObjectId, ref: 'Intake' },
    academicYear: { type: Number, required: true },
    term: { type: String, required: true },
    startDate: Date,
    censusDate: Date,
    applicationDeadlineDomestic: Date,
    applicationDeadlineInternational: Date,
    timezone: { type: String, default: 'Australia/Sydney' },
    status: { type: String, enum: ['open', 'closed', 'upcoming', 'cancelled'], default: 'open' },
  },
  { _id: false }
);

const ProgramOfferingSchema = new Schema<IProgramOffering>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    campus: { type: Schema.Types.ObjectId, ref: 'Campus', required: true, index: true },
    studyMode: {
      type: String,
      enum: ['on-campus', 'online', 'hybrid', 'external'],
      required: true,
      default: 'on-campus',
      index: true,
    },
    attendanceType: {
      type: String,
      enum: ['full-time', 'part-time', 'both'],
      default: 'full-time',
    },
    cricosCourseCode: { type: String, trim: true, sparse: true, index: true },
    cricosStatus: {
      type: String,
      enum: ['registered', 'expired', 'suspended', 'exempt', 'not_applicable'],
      default: 'registered',
      index: true,
    },
    domesticAvailable: { type: Boolean, default: true },
    internationalAvailable: { type: Boolean, default: true },
    availabilityStatus: {
      type: String,
      enum: ['open', 'closed', 'waitlist', 'discontinued'],
      default: 'open',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    intakes: [OfferingIntakeSummarySchema],
    entryRequirements: { type: Schema.Types.ObjectId, ref: 'EntryRequirement' },
    englishRequirements: { type: Schema.Types.ObjectId, ref: 'EnglishRequirement' },
    primaryAnnualFeeAud: Number,
    primaryTotalFeeAud: Number,
    sourceEvidence: { type: Map, of: FieldEvidenceSchema },
    provenance: FieldEvidenceSchema,
    sourceMetadata: {
      sourceName: String,
      sourceResourceId: String,
      sourceUrl: String,
      fetchedAt: Date,
      lastApprovedAt: Date,
      confidence: Number,
    },
  },
  { timestamps: true }
);

// Indexes
ProgramOfferingSchema.index({ program: 1, campus: 1, studyMode: 1 }, { unique: true });
ProgramOfferingSchema.index({ provider: 1, status: 1 });
ProgramOfferingSchema.index({ cricosCourseCode: 1, cricosStatus: 1 });
ProgramOfferingSchema.index({ availabilityStatus: 1, internationalAvailable: 1 });

export const ProgramOffering = mongoose.model<IProgramOffering>('ProgramOffering', ProgramOfferingSchema);
