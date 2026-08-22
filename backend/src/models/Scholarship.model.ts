/**
 * Scholarship.model.ts — Canonical Scholarship & Opportunity Model.
 * Supports typed deadlines, IANA timezone specification, structured benefits, and provenance.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export interface ISourceLink {
  label: string;
  url: string;
  type?: string; // e.g., official page, application page, PDF
  verified?: boolean;
  lastCheckedAt?: Date;
}

export interface IStructuredAmount {
  value?: number;
  currency: string;
  period: 'one_off' | 'annual' | 'per_semester' | 'full_tuition' | 'partial_tuition' | 'variable';
  description?: string;
}

export interface IScholarship extends Document {
  // Canonical fields
  provider?: Types.ObjectId; // Ref to University
  title: string;
  slug?: string;
  shortSummary?: string;
  description?: string;
  category?: string; // scholarship, grant, bursary, fellowship
  type?: string;
  imageUrl?: string;
  imageAlt?: string;
  country?: string;
  state?: string;
  city?: string;
  structuredAmount?: IStructuredAmount;
  eligibility?: string;
  benefits?: string;
  requiredDocuments?: string;
  applicationSteps?: string;
  importantNotes?: string;
  tags?: string[];
  contactEmail?: string;
  deadlineDate?: Date; // Typed ISO Date
  deadlineTime?: string; // e.g. "17:00"
  deadlineTimezone?: string; // e.g. "Australia/Sydney"
  openingDate?: Date; // Typed ISO Date
  applicationLink?: string;
  sourceLinks?: ISourceLink[];
  sourceEvidence?: IFieldEvidence;

  // Status & Visibility
  status: 'draft' | 'published' | 'archived' | 'expired' | 'unpublished' | 'pending' | 'approved' | 'rejected';
  visibility?: 'public' | 'private';
  featured?: boolean;
  priorityOrder?: number;
  seoTitle?: string;
  seoDescription?: string;

  // Legacy fields kept for backward compatibility
  universityId?: Types.ObjectId;
  linkedUniversity?: Types.ObjectId;
  amount?: string;
  deadline?: string;
  sourceUrl?: string;
  confidence?: number;
  fetchedAt?: Date;
  approvedAt?: Date;

  // Audit fields
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  archivedAt?: Date;
  archivedBy?: Types.ObjectId | string;
  archiveReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SourceLinkSchema = new Schema<ISourceLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    type: String,
    verified: { type: Boolean, default: false },
    lastCheckedAt: Date,
  },
  { _id: false }
);

const StructuredAmountSchema = new Schema<IStructuredAmount>(
  {
    value: Number,
    currency: { type: String, default: 'AUD' },
    period: {
      type: String,
      enum: ['one_off', 'annual', 'per_semester', 'full_tuition', 'partial_tuition', 'variable'],
      default: 'annual',
    },
    description: String,
  },
  { _id: false }
);

const ScholarshipSchema = new Schema<IScholarship>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    shortSummary: String,
    description: String,
    category: { type: String, index: true },
    type: String,
    imageUrl: String,
    imageAlt: String,
    country: { type: String, default: 'Australia', trim: true },
    state: String,
    city: String,
    structuredAmount: StructuredAmountSchema,
    eligibility: String,
    benefits: String,
    requiredDocuments: String,
    applicationSteps: String,
    importantNotes: String,
    tags: [{ type: String, index: true }],
    contactEmail: String,
    deadlineDate: { type: Date, index: true },
    deadlineTime: String,
    deadlineTimezone: { type: String, default: 'Australia/Sydney' },
    openingDate: Date,
    applicationLink: String,
    sourceLinks: [SourceLinkSchema],
    sourceEvidence: FieldEvidenceSchema,

    status: {
      type: String,
      enum: ['draft', 'published', 'archived', 'expired', 'unpublished', 'pending', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public',
    },
    featured: { type: Boolean, default: false, index: true },
    priorityOrder: { type: Number, default: 0 },
    seoTitle: String,
    seoDescription: String,

    // Legacy fields
    universityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    linkedUniversity: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    amount: String,
    deadline: String,
    sourceUrl: String,
    confidence: { type: Number, default: 0.8 },
    fetchedAt: Date,
    approvedAt: Date,

    createdBy: { type: Schema.Types.Mixed },
    updatedBy: { type: Schema.Types.Mixed },
    archivedAt: Date,
    archivedBy: { type: Schema.Types.Mixed },
    archiveReason: String,
  },
  { timestamps: true }
);

// Synchronization hook
ScholarshipSchema.pre('save', function (next) {
  if (this.provider && !this.linkedUniversity) {
    this.linkedUniversity = this.provider;
  } else if (this.linkedUniversity && !this.provider) {
    this.provider = this.linkedUniversity;
  }

  if (this.linkedUniversity && !this.universityId) {
    this.universityId = this.linkedUniversity;
  } else if (this.universityId && !this.linkedUniversity) {
    this.linkedUniversity = this.universityId;
  }

  if (this.sourceLinks && this.sourceLinks.length > 0 && !this.sourceUrl) {
    this.sourceUrl = this.sourceLinks[0].url;
  } else if (this.sourceUrl && (!this.sourceLinks || this.sourceLinks.length === 0)) {
    this.sourceLinks = [{ label: 'Official Source', url: this.sourceUrl }];
  }

  next();
});

ScholarshipSchema.index({
  title: 'text',
  shortSummary: 'text',
  description: 'text',
  tags: 'text',
});
ScholarshipSchema.index({ provider: 1, status: 1 });
ScholarshipSchema.index({ deadlineDate: 1, status: 1 });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);
