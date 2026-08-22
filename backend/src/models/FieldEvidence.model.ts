import mongoose, { Schema } from 'mongoose';

export type SourceType =
  | 'CRICOS'
  | 'TEQSA'
  | 'UNIVERSITY_OFFICIAL'
  | 'FEE_SCHEDULE'
  | 'RANKING_PUBLISHER'
  | 'QILT_GOVERNMENT'
  | 'MANUAL'
  | 'SECONDARY'
  | 'REQUIREMENT_PAGE'
  | 'SCHOLARSHIP_PAGE'
  | 'GOVERNMENT';

export interface IFieldEvidence {
  fieldName?: string;
  value?: any;
  sourceUrl: string;
  sourceType: SourceType;
  confidence: number; // 0.0 to 1.0 (normalized)
  fetchedAt: Date;
  lastVerifiedAt: Date;
  parserVersion: string;
  rawSnippet?: string;
}

export const FieldEvidenceSchema = new Schema<IFieldEvidence>(
  {
    fieldName: { type: String, trim: true },
    value: { type: Schema.Types.Mixed },
    sourceUrl: { type: String, required: true, trim: true },
    sourceType: {
      type: String,
      enum: [
        'CRICOS',
        'TEQSA',
        'UNIVERSITY_OFFICIAL',
        'FEE_SCHEDULE',
        'RANKING_PUBLISHER',
        'QILT_GOVERNMENT',
        'MANUAL',
        'SECONDARY',
        'REQUIREMENT_PAGE',
        'SCHOLARSHIP_PAGE',
        'GOVERNMENT',
      ],
      required: true,
      default: 'UNIVERSITY_OFFICIAL',
    },
    confidence: { type: Number, required: true, min: 0, max: 1, default: 0.9 },
    fetchedAt: { type: Date, required: true, default: Date.now },
    lastVerifiedAt: { type: Date, required: true, default: Date.now },
    parserVersion: { type: String, required: true, default: '1.0.0' },
    rawSnippet: { type: String },
  },
  { _id: false }
);

export const FieldEvidence = mongoose.model<IFieldEvidence>(
  'FieldEvidence',
  FieldEvidenceSchema
);
