/**
 * FeeObservation.model.ts — Canonical Fee Observation Model.
 * Captures amount, currency, fee basis, academic year, domestic/international applicability,
 * effective dates, and full source evidence.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type FeeBasis =
  | 'annual'
  | 'total_course'
  | 'per_credit_point'
  | 'per_unit'
  | 'per_semester'
  | 'non_tuition'
  | 'amenities'
  | 'application';

export type FeeAudience = 'domestic' | 'international' | 'both';
export type FeeStatus = 'verified' | 'draft' | 'superseded' | 'disputed';

export interface IFeeObservation extends Document {
  provider: Types.ObjectId; // Ref to University
  program: Types.ObjectId; // Ref to Program
  offering?: Types.ObjectId; // Optional Ref to ProgramOffering
  academicYear: number; // e.g. 2025, 2026
  feeBasis: FeeBasis;
  audience: FeeAudience;
  amount: number;
  currency: string; // Default 'AUD'
  effectiveStartDate?: Date;
  effectiveEndDate?: Date;
  isEstimate: boolean;
  notes?: string;
  status: FeeStatus;
  sourceEvidence: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const FeeObservationSchema = new Schema<IFeeObservation>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: 'ProgramOffering', index: true },
    academicYear: { type: Number, required: true, index: true },
    feeBasis: {
      type: String,
      enum: ['annual', 'total_course', 'per_credit_point', 'per_unit', 'per_semester', 'non_tuition', 'amenities', 'application'],
      required: true,
      default: 'annual',
      index: true,
    },
    audience: {
      type: String,
      enum: ['domestic', 'international', 'both'],
      required: true,
      default: 'international',
      index: true,
    },
    amount: { type: Number, required: true, min: 0, index: true },
    currency: { type: String, required: true, default: 'AUD', uppercase: true },
    effectiveStartDate: Date,
    effectiveEndDate: Date,
    isEstimate: { type: Boolean, default: false },
    notes: String,
    status: {
      type: String,
      enum: ['verified', 'draft', 'superseded', 'disputed'],
      default: 'verified',
      index: true,
    },
    sourceEvidence: { type: FieldEvidenceSchema, required: true },
  },
  { timestamps: true }
);

// Compound indexes
FeeObservationSchema.index({ program: 1, academicYear: 1, audience: 1, feeBasis: 1 });
FeeObservationSchema.index({ provider: 1, academicYear: 1, status: 1 });
FeeObservationSchema.index({ amount: 1, feeBasis: 1, audience: 1 });

export const FeeObservation = mongoose.model<IFeeObservation>('FeeObservation', FeeObservationSchema);
