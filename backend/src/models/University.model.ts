/**
 * University.model.ts — Canonical Provider / University Model.
 * Implements canonical fields, field-level provenance, and derived counters
 * while preserving legacy fields for backward compatibility (expand-migrate-contract).
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

// Campus sub-document (for embedded campus representations)
export interface ICampusSubdoc {
  name: string;
  city?: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  campusCode?: string;
}

// Source metadata sub-document (for batch import / legacy connectors)
export interface ISourceMetadata {
  createdBy?: string;
  createdVia: 'csv' | 'manual' | 'connector' | 'ai_ingestion' | 'cricos_api';
  sourceName?: string;
  sourceResourceId?: string;
  sourceUrl?: string;
  fetchedAt?: Date;
  lastVerifiedAt?: Date;
  confidence?: number;
  importMethod?: 'manual' | 'csv' | 'cricos_api' | 'connector';
  notes?: string;
}

export type IngestionStatus = 'not_started' | 'queued' | 'running' | 'completed' | 'failed' | 'partial';
export type CricosSyncStatus = 'not_synced' | 'synced' | 'changes_pending' | 'failed';
export type ProviderStatus = 'active' | 'inactive' | 'draft' | 'archived';

export interface IPostalAddress {
  line1?: string;
  line2?: string;
  line3?: string;
  line4?: string;
  city?: string;
  state?: string;
  postcode?: string;
}

export interface IUniversity extends Document {
  // --- Canonical Provider Identity ---
  name: string;
  slug: string;
  shortName?: string;
  country: string;
  state: string;
  city?: string;
  officialWebsite?: string;
  logoUrl?: string;
  providerType?: string; // 'university' | 'higher_education' | 'tafe' | 'vocational' | 'pathway' | 'english_language' | 'public' | 'private'
  cricosProviderCode?: string;
  teqsaProviderId?: string;
  establishedYear?: number;
  description?: string;
  status: ProviderStatus;
  postalAddress?: IPostalAddress;
  campusDetails?: ICampusSubdoc[];

  // --- Provenance & Source Evidence ---
  sourceEvidence?: Map<string, IFieldEvidence> | Record<string, IFieldEvidence>;
  provenance?: IFieldEvidence;
  sourceMetadata?: ISourceMetadata;
  sourceUrls?: string[];

  // --- Denormalized / Derived Fields (maintained by triggers & reconcilers) ---
  programCount: number;
  offeringCount?: number;
  campusCount?: number;
  primaryRank?: number;
  averageEstimatedTotalCostAud?: number;
  averageTuitionAud?: number;

  // --- Ingestion / Sync Status ---
  ingestionStatus?: IngestionStatus;
  lastSyncedAt?: Date;
  autoDiscoverPrograms?: boolean;
  institutionType?: string;
  institutionCapacity?: number;
  lastCricosSyncedAt?: Date;
  cricosSyncStatus?: CricosSyncStatus;
  lastSyncError?: string;
  lastSyncRunId?: Types.ObjectId;
  cricosDataHash?: string;

  // --- Legacy fields kept for backward compatibility ---
  location?: string;           // @deprecated: alias for city/state
  website?: string;            // @deprecated: alias for officialWebsite
  logo?: string;               // @deprecated: alias for logoUrl
  ranking?: number;            // @deprecated: prefer RankingObservation
  rankingBand?: string;        // @deprecated: 'top50', 'top100', 'top200', 'top500', 'unranked'
  type?: 'public' | 'private'; // @deprecated: use providerType or institutionType
  campuses?: string[];         // @deprecated: string array; prefer Campus collection / campusDetails
  internationalStudents?: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const PostalAddressSchema = new Schema<IPostalAddress>(
  {
    line1: String,
    line2: String,
    line3: String,
    line4: String,
    city: String,
    state: String,
    postcode: String,
  },
  { _id: false }
);

const CampusSubSchema = new Schema<ICampusSubdoc>(
  {
    name: { type: String, required: true },
    city: String,
    state: String,
    address: String,
    latitude: Number,
    longitude: Number,
    campusCode: String,
  },
  { _id: false }
);

const SourceMetadataSchema = new Schema<ISourceMetadata>(
  {
    createdBy: String,
    createdVia: { type: String, enum: ['csv', 'manual', 'connector', 'ai_ingestion', 'cricos_api'], default: 'manual' },
    sourceName: String,
    sourceResourceId: String,
    sourceUrl: String,
    fetchedAt: Date,
    lastVerifiedAt: Date,
    confidence: Number,
    importMethod: { type: String, enum: ['manual', 'csv', 'cricos_api', 'connector'] },
    notes: String,
  },
  { _id: false }
);

const UniversitySchema = new Schema<IUniversity>(
  {
    // Canonical Identity
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    shortName: { type: String, trim: true },
    country: { type: String, default: 'Australia', trim: true },
    state: { type: String, trim: true, index: true },
    city: { type: String, trim: true, index: true },
    officialWebsite: { type: String, trim: true, index: true },
    logoUrl: { type: String },
    providerType: { type: String, trim: true, index: true },
    cricosProviderCode: { type: String, trim: true, sparse: true, index: true },
    teqsaProviderId: { type: String, trim: true, sparse: true, index: true },
    establishedYear: { type: Number },
    description: { type: String },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    postalAddress: PostalAddressSchema,
    campusDetails: [CampusSubSchema],

    // Provenance & Source Evidence
    sourceEvidence: { type: Map, of: FieldEvidenceSchema },
    provenance: FieldEvidenceSchema,
    sourceMetadata: SourceMetadataSchema,
    sourceUrls: [{ type: String }],

    // Denormalized / Derived Metrics
    programCount: { type: Number, default: 0, index: true },
    offeringCount: { type: Number, default: 0 },
    campusCount: { type: Number, default: 0 },
    primaryRank: { type: Number, index: true },
    averageEstimatedTotalCostAud: { type: Number },
    averageTuitionAud: { type: Number },

    // Ingestion / Sync Status
    ingestionStatus: {
      type: String,
      enum: ['not_started', 'queued', 'running', 'completed', 'failed', 'partial'],
      default: 'not_started',
      index: true,
    },
    lastSyncedAt: Date,
    autoDiscoverPrograms: { type: Boolean, default: false },
    institutionType: { type: String, trim: true },
    institutionCapacity: { type: Number },
    lastCricosSyncedAt: { type: Date, index: true },
    cricosSyncStatus: {
      type: String,
      enum: ['not_synced', 'synced', 'changes_pending', 'failed'],
      default: 'not_synced',
      index: true,
    },
    lastSyncError: String,
    lastSyncRunId: { type: Schema.Types.ObjectId, ref: 'CricosSyncRun' },
    cricosDataHash: { type: String },

    // Legacy fields preserved for backward compatibility
    location: String,
    website: String,
    logo: String,
    ranking: Number,
    rankingBand: { type: String, enum: ['top50', 'top100', 'top200', 'top500', 'unranked'] },
    type: { type: String, enum: ['public', 'private'] },
    campuses: [{ type: String }],
    internationalStudents: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
UniversitySchema.index({ name: 'text', shortName: 'text', description: 'text', city: 'text', state: 'text' });
UniversitySchema.index({ status: 1, state: 1 });
UniversitySchema.index({ cricosProviderCode: 1, status: 1 });

export const University = mongoose.model<IUniversity>('University', UniversitySchema);
