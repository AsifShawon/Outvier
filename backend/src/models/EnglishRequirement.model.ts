/**
 * EnglishRequirement.model.ts — Canonical English Language Proficiency Model.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export interface ITestScores {
  ieltsOverall?: number;
  ieltsBandMin?: number;
  ieltsListening?: number;
  ieltsReading?: number;
  ieltsWriting?: number;
  ieltsSpeaking?: number;
  toeflIbt?: number;
  pteAcademic?: number;
  cambridgeScore?: number;
  duolingo?: number;
}

export interface IEnglishRequirement extends Document {
  program: Types.ObjectId; // Ref to Program
  offering?: Types.ObjectId; // Ref to ProgramOffering
  testScores: ITestScores;
  waiverConditions?: string[];
  notes?: string;
  sourceEvidence?: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const TestScoresSchema = new Schema<ITestScores>(
  {
    ieltsOverall: Number,
    ieltsBandMin: Number,
    ieltsListening: Number,
    ieltsReading: Number,
    ieltsWriting: Number,
    ieltsSpeaking: Number,
    toeflIbt: Number,
    pteAcademic: Number,
    cambridgeScore: Number,
    duolingo: Number,
  },
  { _id: false }
);

const EnglishRequirementSchema = new Schema<IEnglishRequirement>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true, index: true },
    offering: { type: Schema.Types.ObjectId, ref: 'ProgramOffering', index: true },
    testScores: { type: TestScoresSchema, required: true },
    waiverConditions: [String],
    notes: String,
    sourceEvidence: FieldEvidenceSchema,
  },
  { timestamps: true }
);

export const EnglishRequirement = mongoose.model<IEnglishRequirement>('EnglishRequirement', EnglishRequirementSchema);
