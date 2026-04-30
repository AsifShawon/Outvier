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
  createdVia: 'csv' | 'manual' | 'connector';
  lastVerifiedAt?: Date;
  notes?: string;
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
  // --- New fields ---
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
  createdAt: Date;
  updatedAt: Date;
}

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
    createdVia: { type: String, enum: ['csv', 'manual', 'connector'], default: 'manual' },
    lastVerifiedAt: Date,
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
  },
  { timestamps: true }
);

// Full-text index
UniversitySchema.index({ name: 'text', shortName: 'text', description: 'text', city: 'text', state: 'text' });
UniversitySchema.index({ status: 1 });

export const University = mongoose.model<IUniversity>('University', UniversitySchema);
