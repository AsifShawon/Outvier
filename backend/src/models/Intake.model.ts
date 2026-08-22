/**
 * Intake.model.ts — Canonical Intake Model.
 * Uses typed Date fields and IANA time zones for intakes and deadlines.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type IntakeStatus = 'open' | 'closed' | 'upcoming' | 'cancelled';

export interface IIntake extends Document {
  program: Types.ObjectId; // Ref to Program
  offering?: Types.ObjectId; // Ref to ProgramOffering
  provider: Types.ObjectId; // Ref to University
  academicYear: number; // e.g. 2025, 2026
  term: string; // e.g. 'Semester 1', 'Semester 2', 'Term 1', 'Term 2', 'Term 3', 'Trimester 1', 'Trimester 2', 'Trimester 3', 'Summer', 'Winter'
  startDate: Date; // Typed ISO Date
  censusDate?: Date; // Typed ISO Date
  endDate?: Date; // Typed ISO Date
  applicationDeadlineDomestic?: Date; // Typed ISO Date
  applicationDeadlineInternational?: Date; // Typed ISO Date
  timezone: string; // IANA Timezone, e.g. 'Australia/Sydney', 'Australia/Melbourne', 'Australia/Brisbane', 'Australia/Perth'
  status: IntakeStatus;
  capacity?: number;
  comments?: string;
  sourceEvidence?: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const IntakeSchema = new Schema<IIntake>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: 'ProgramOffering', index: true },
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    academicYear: { type: Number, required: true, index: true },
    term: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true, index: true },
    censusDate: { type: Date },
    endDate: { type: Date },
    applicationDeadlineDomestic: { type: Date },
    applicationDeadlineInternational: { type: Date, index: true },
    timezone: { type: String, required: true, default: 'Australia/Sydney' },
    status: {
      type: String,
      enum: ['open', 'closed', 'upcoming', 'cancelled'],
      default: 'open',
      index: true,
    },
    capacity: { type: Number },
    comments: { type: String },
    sourceEvidence: FieldEvidenceSchema,
  },
  { timestamps: true }
);

// Indexes
IntakeSchema.index({ program: 1, academicYear: 1, term: 1 });
IntakeSchema.index({ academicYear: 1, status: 1, startDate: 1 });
IntakeSchema.index({ applicationDeadlineInternational: 1, status: 1 });

export const Intake = mongoose.model<IIntake>('Intake', IntakeSchema);
