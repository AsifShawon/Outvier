import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISourceLink {
  label: string;
  url: string;
  type?: string; // e.g., official page, application page, PDF
  verified?: boolean;
  lastCheckedAt?: Date;
}

export interface IScholarship extends Document {
  // --- Legacy fields (keep backward compatibility) ---
  universityId?: Types.ObjectId; // Kept for AI scripts
  amount?: string;
  eligibility?: string; // (also used by new)
  deadline?: string; // legacy string deadline
  sourceUrl?: string; // legacy main source URL
  confidence?: number;
  fetchedAt?: Date;
  approvedAt?: Date;

  // --- New fields (formerly Opportunity) ---
  title: string;
  slug?: string;
  shortSummary?: string;
  description?: string;
  category?: string; // scholarship, grant, event, etc.
  type?: string;
  imageUrl?: string;
  imageAlt?: string;
  linkedUniversity?: Types.ObjectId; // Can alias to universityId
  country?: string;
  state?: string;
  city?: string;
  deadlineDate?: Date;
  deadlineTime?: string;
  deadlineTimezone?: string;
  openingDate?: Date;
  applicationLink?: string;
  sourceLinks?: ISourceLink[];
  benefits?: string;
  requiredDocuments?: string;
  applicationSteps?: string;
  importantNotes?: string;
  tags?: string[];
  contactEmail?: string;
  
  // Merged Status:
  status: 'draft' | 'published' | 'archived' | 'expired' | 'unpublished' | 'pending' | 'approved' | 'rejected';
  
  visibility?: 'public' | 'private';
  featured?: boolean;
  priorityOrder?: number;
  seoTitle?: string;
  seoDescription?: string;
  
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

const ScholarshipSchema = new Schema<IScholarship>(
  {
    // Legacy
    universityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    amount: String,
    deadline: String,
    sourceUrl: String,
    confidence: { type: Number, default: 0.8 },
    fetchedAt: Date,
    approvedAt: Date,

    // Shared / New
    title: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
    shortSummary: { type: String },
    description: { type: String },
    category: { type: String, index: true },
    type: String,
    imageUrl: String,
    imageAlt: String,
    linkedUniversity: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    country: { type: String, default: 'Australia', trim: true },
    state: String,
    city: String,
    deadlineDate: { type: Date, index: true },
    deadlineTime: String,
    deadlineTimezone: String,
    openingDate: Date,
    applicationLink: String,
    sourceLinks: [SourceLinkSchema],
    eligibility: String,
    benefits: String,
    requiredDocuments: String,
    applicationSteps: String,
    importantNotes: String,
    tags: [{ type: String, index: true }],
    contactEmail: String,
    
    // Status merged
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

    createdBy: { type: Schema.Types.Mixed },
    updatedBy: { type: Schema.Types.Mixed },
    archivedAt: Date,
    archivedBy: { type: Schema.Types.Mixed },
    archiveReason: String,
  },
  { timestamps: true }
);

// Mongoose pre-save to sync legacy universityId <-> linkedUniversity
ScholarshipSchema.pre('save', function (next) {
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

// Full-text index for search
ScholarshipSchema.index({
  title: 'text',
  shortSummary: 'text',
  description: 'text',
  tags: 'text',
});

ScholarshipSchema.index({ universityId: 1, status: 1 });

export const Scholarship = mongoose.model<IScholarship>('Scholarship', ScholarshipSchema);
