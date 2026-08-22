/**
 * RankingObservation.model.ts — Canonical Ranking Observation Model.
 * Includes publisher, edition/year, ranking type, rank or band, licensed source reference,
 * publication date, and verification date with source evidence.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type RankingPublisher = 'QS' | 'THE' | 'ARWU' | 'US_NEWS' | 'CWUR' | 'AFR' | 'OTHER';
export type RankingType = 'overall' | 'subject' | 'employability' | 'sustainability' | 'impact';
export type RankingStatus = 'verified' | 'pending' | 'superseded';

export interface IRankingObservation extends Document {
  provider: Types.ObjectId; // Ref to University
  publisher: RankingPublisher;
  editionYear: number; // e.g. 2025, 2026
  rankingType: RankingType;
  subjectName?: string; // Optional discipline for subject rankings
  rank?: number; // Integer rank, e.g. 19
  rankBand?: string; // Band string, e.g. '151-200', 'top50'
  score?: number; // Overall score, e.g. 89.4
  nationalRank?: number;
  licensedSourceRef?: string; // Licensed reference, e.g. "QS World University Rankings 2025 License #4892"
  publicationDate?: Date; // When the ranking was officially published
  verificationDate: Date; // When verified by system/admin
  status: RankingStatus;
  sourceEvidence: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const RankingObservationSchema = new Schema<IRankingObservation>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    publisher: {
      type: String,
      enum: ['QS', 'THE', 'ARWU', 'US_NEWS', 'CWUR', 'AFR', 'OTHER'],
      required: true,
      index: true,
    },
    editionYear: { type: Number, required: true, index: true },
    rankingType: {
      type: String,
      enum: ['overall', 'subject', 'employability', 'sustainability', 'impact'],
      required: true,
      default: 'overall',
      index: true,
    },
    subjectName: { type: String, trim: true },
    rank: { type: Number, index: true },
    rankBand: { type: String, trim: true },
    score: Number,
    nationalRank: Number,
    licensedSourceRef: { type: String, trim: true },
    publicationDate: Date,
    verificationDate: { type: Date, required: true, default: Date.now },
    status: {
      type: String,
      enum: ['verified', 'pending', 'superseded'],
      default: 'verified',
      index: true,
    },
    sourceEvidence: { type: FieldEvidenceSchema, required: true },
  },
  { timestamps: true }
);

// Compound Unique Index
RankingObservationSchema.index(
  { provider: 1, publisher: 1, editionYear: 1, rankingType: 1, subjectName: 1 },
  { unique: true }
);

RankingObservationSchema.index({ publisher: 1, editionYear: 1, rank: 1 });

export const RankingObservation = mongoose.model<IRankingObservation>('RankingObservation', RankingObservationSchema);
