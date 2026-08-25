import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';

export type DocumentType =
  | 'passport'
  | 'transcript'
  | 'degree_certificate'
  | 'english_test'
  | 'cv_resume'
  | 'sop'
  | 'lor'
  | 'financial_proof'
  | 'visa'
  | 'portfolio'
  | 'other';

export type ScanStatus = 'pending' | 'clean' | 'quarantined' | 'infected';
export type RetentionState = 'active' | 'archived' | 'scheduled_deletion' | 'deleted';
export type VerificationStatus = 'unverified' | 'staff_verified' | 'rejected';

export interface IDocumentRecord extends MongooseDocument {
  userId: Types.ObjectId;
  applicationId?: Types.ObjectId;
  documentType: DocumentType;
  title: string;
  originalFilename: string;
  storageKey: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  scanStatus: ScanStatus;
  scanDetails?: string;
  encryptionAlgorithm: 'AES-256-GCM' | 'NONE';
  retentionState: RetentionState;
  verificationStatus: VerificationStatus;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentRecordSchema = new Schema<IDocumentRecord>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
    documentType: {
      type: String,
      enum: [
        'passport',
        'transcript',
        'degree_certificate',
        'english_test',
        'cv_resume',
        'sop',
        'lor',
        'financial_proof',
        'visa',
        'portfolio',
        'other',
      ],
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    originalFilename: { type: String, required: true, trim: true, maxlength: 255 },
    storageKey: { type: String, required: true, unique: true },
    mimeType: { type: String, required: true, trim: true },
    fileSizeBytes: { type: Number, required: true, min: 0 },
    checksumSha256: { type: String, required: true },
    scanStatus: {
      type: String,
      enum: ['pending', 'clean', 'quarantined', 'infected'],
      default: 'clean',
      index: true,
    },
    scanDetails: { type: String },
    encryptionAlgorithm: {
      type: String,
      enum: ['AES-256-GCM', 'NONE'],
      default: 'AES-256-GCM',
    },
    retentionState: {
      type: String,
      enum: ['active', 'archived', 'scheduled_deletion', 'deleted'],
      default: 'active',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'staff_verified', 'rejected'],
      default: 'unverified',
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date },
    rejectionReason: { type: String, maxlength: 500 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

DocumentRecordSchema.index({ userId: 1, documentType: 1 });
DocumentRecordSchema.index({ userId: 1, retentionState: 1 });

export const DocumentRecord = mongoose.model<IDocumentRecord>('DocumentRecord', DocumentRecordSchema);
