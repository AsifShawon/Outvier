/**
 * Campus.model.ts — Canonical Campus Model.
 * Represents physical and virtual campuses under a Provider.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export interface ICoordinates {
  latitude?: number;
  longitude?: number;
}

export interface ICampus extends Document {
  provider: Types.ObjectId; // Canonical ref to University
  university: Types.ObjectId; // Legacy alias to University
  cricosProviderCode: string;
  cricosLocationCode?: string;
  campusCode?: string;
  institutionName?: string;
  name: string;
  locationType?: string; // 'Main' | 'Regional' | 'Offshore' | 'Partner' | 'Online'
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  fullAddress?: string;
  coordinates?: ICoordinates;
  sourceEvidence?: Map<string, IFieldEvidence> | Record<string, IFieldEvidence>;
  sourceMetadata?: {
    sourceName: string;
    sourceResourceId?: string;
    sourceUrl?: string;
    fetchedAt?: Date;
    lastApprovedAt?: Date;
    confidence: number;
    importMethod?: 'cricos_api' | 'manual' | 'connector';
  };
  status: 'active' | 'inactive' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

const CoordinatesSchema = new Schema<ICoordinates>(
  {
    latitude: Number,
    longitude: Number,
  },
  { _id: false }
);

const CampusSchema = new Schema<ICampus>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    cricosProviderCode: { type: String, required: true, index: true },
    cricosLocationCode: { type: String, trim: true, sparse: true, index: true },
    campusCode: { type: String, trim: true },
    institutionName: String,
    name: { type: String, required: true, trim: true },
    locationType: { type: String, trim: true, default: 'Main' },
    addressLine1: { type: String, required: true },
    addressLine2: String,
    addressLine3: String,
    addressLine4: String,
    city: { type: String, required: true, index: true },
    state: { type: String, required: true, index: true },
    postcode: { type: String, required: true },
    country: { type: String, default: 'Australia' },
    fullAddress: String,
    coordinates: CoordinatesSchema,
    sourceEvidence: { type: Map, of: FieldEvidenceSchema },
    sourceMetadata: {
      sourceName: { type: String, default: 'CRICOS' },
      sourceResourceId: String,
      sourceUrl: String,
      fetchedAt: Date,
      lastApprovedAt: Date,
      confidence: { type: Number, default: 1 },
      importMethod: { type: String, enum: ['cricos_api', 'manual', 'connector'] },
    },
    status: { type: String, enum: ['active', 'inactive', 'draft', 'archived'], default: 'active', index: true },
  },
  { timestamps: true }
);

// Pre-save hook to synchronize provider <-> university
CampusSchema.pre('save', function (next) {
  if (this.provider && !this.university) {
    this.university = this.provider;
  } else if (this.university && !this.provider) {
    this.provider = this.university;
  }

  if (!this.fullAddress && this.addressLine1) {
    const parts = [this.addressLine1, this.addressLine2, this.city, this.state, this.postcode, this.country].filter(Boolean);
    this.fullAddress = parts.join(', ');
  }
  next();
});

// Indexes
CampusSchema.index({ cricosProviderCode: 1, name: 1, city: 1, postcode: 1 }, { unique: true, sparse: true });
CampusSchema.index({ provider: 1, status: 1 });
CampusSchema.index({ city: 1, state: 1 });

export const Campus = mongoose.model<ICampus>('Campus', CampusSchema);
