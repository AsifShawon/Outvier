/**
 * University.model.ts — extended with ingestion tracking fields.
 * All legacy fields preserved for backward compatibility.
 */
import mongoose, { Document, Schema } from 'mongoose';

// Campus sub-document
export interface ICampus {
  name: string;
  city?: string;
  state?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// Source metadata sub-document
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
  // --- Legacy fields kept for backward compat ---
  name: string;
  slug: string;
  description?: string;
  location?: string;           // legacy alias for city
  website?: string;            // legacy alias for officialWebsite
  logo?: string;               // legacy alias for logoUrl
  establishedYear?: number;
  ranking?: number;            // legacy; prefer RankingRecord
  type?: 'public' | 'private';
  campuses?: string[];         // legacy string array; new: campusDetails
  internationalStudents?: boolean;
  // --- Existing new fields ---
  shortName?: string;
  country: string;
  state: string;
  city?: string;
  campusDetails?: ICampus[];
  officialWebsite?: string;
  cricosProviderCode?: string;
  logoUrl?: string;
  providerType?: string;
  status: 'active' | 'inactive' | 'draft';
  sourceMetadata?: ISourceMetadata;
  // --- Ingestion tracking fields ---
  teqsaProviderId?: string;
  sourceUrls?: string[];
  ingestionStatus?: IngestionStatus;
  lastSyncedAt?: Date;
  autoDiscoverPrograms?: boolean;
  // --- CRICOS-specific fields ---
  institutionType?: string;
  institutionCapacity?: number;
  postalAddress?: IPostalAddress;
  lastCricosSyncedAt?: Date;
  cricosSyncStatus?: CricosSyncStatus;
  cricosDataHash?: string;
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

const CampusSchema = new Schema<ICampus>(
  {
    name: { type: String, required: true },
    city: String,
    state: String,
    address: String,
    latitude: Number,
    longitude: Number,
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
    // Legacy
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: String,
    location: String,
    website: String,
    logo: String,
    establishedYear: Number,
    ranking: Number,
    type: { type: String, enum: ['public', 'private'] },
    campuses: [{ type: String }],
    internationalStudents: { type: Boolean, default: true },
    // New
    shortName: { type: String, trim: true },
    country: { type: String, default: 'Australia', trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    campusDetails: [CampusSchema],
    officialWebsite: { type: String, trim: true, index: true },
    cricosProviderCode: { type: String, trim: true, sparse: true, index: true },
    logoUrl: String,
    providerType: String,
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
    sourceMetadata: SourceMetadataSchema,
    // Ingestion tracking
    teqsaProviderId: { type: String, trim: true, sparse: true, index: true },
    sourceUrls: [{ type: String }],
    ingestionStatus: {
      type: String,
      enum: ['not_started', 'queued', 'running', 'completed', 'failed', 'partial'],
      default: 'not_started',
    },
    lastSyncedAt: Date,
    autoDiscoverPrograms: { type: Boolean, default: false },
    // CRICOS-specific
    institutionType: { type: String, trim: true },
    institutionCapacity: { type: Number },
    postalAddress: PostalAddressSchema,
    lastCricosSyncedAt: { type: Date, index: true },
    cricosSyncStatus: {
      type: String,
      enum: ['not_synced', 'synced', 'changes_pending', 'failed'],
      default: 'not_synced',
      index: true,
    },
    cricosDataHash: { type: String },
  },
  { timestamps: true }
);

// Full-text index
UniversitySchema.index({ name: 'text', shortName: 'text', description: 'text', city: 'text', state: 'text' });
UniversitySchema.index({ status: 1 });
UniversitySchema.index({ ingestionStatus: 1 });

export const University = mongoose.model<IUniversity>('University', UniversitySchema);
