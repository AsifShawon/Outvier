/**
 * EntryRequirement.model.ts — Canonical Academic Entry Requirements Model.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export interface ICountrySpecificRequirement {
  country: string;
  qualification: string;
  minimumScore: string;
  notes?: string;
}

export interface IEntryRequirement extends Document {
  program: Types.ObjectId; // Ref to Program
  offering?: Types.ObjectId; // Ref to ProgramOffering
  audience: 'domestic' | 'international' | 'all';
  academicRequirementText: string;
  minimumGPA?: {
    score: number;
    scale: number; // e.g. 4.0, 7.0, 100
    text?: string;
  };
  atarScore?: number; // Australian Tertiary Admission Rank
  prerequisiteSubjects?: string[];
  workExperienceRequired?: boolean;
  workExperienceYears?: number;
  portfolioRequired?: boolean;
  interviewRequired?: boolean;
  countrySpecificRequirements?: ICountrySpecificRequirement[];
  sourceEvidence?: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const CountrySpecificRequirementSchema = new Schema<ICountrySpecificRequirement>(
  {
    country: { type: String, required: true },
    qualification: { type: String, required: true },
    minimumScore: { type: String, required: true },
    notes: String,
  },
  { _id: false }
);

const EntryRequirementSchema = new Schema<IEntryRequirement>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: 'ProgramOffering', index: true },
    audience: { type: String, enum: ['domestic', 'international', 'all'], default: 'all' },
    academicRequirementText: { type: String, required: true },
    minimumGPA: {
      score: Number,
      scale: { type: Number, default: 4.0 },
      text: String,
    },
    atarScore: Number,
    prerequisiteSubjects: [String],
    workExperienceRequired: { type: Boolean, default: false },
    workExperienceYears: Number,
    portfolioRequired: { type: Boolean, default: false },
    interviewRequired: { type: Boolean, default: false },
    countrySpecificRequirements: [CountrySpecificRequirementSchema],
    sourceEvidence: FieldEvidenceSchema,
  },
  { timestamps: true }
);

export const EntryRequirement = mongoose.model<IEntryRequirement>('EntryRequirement', EntryRequirementSchema);
