import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';

export interface ISubmissionReceipt {
  submissionId: string;
  method: 'student-manual' | 'staff-assisted' | 'partner-integration';
  partnerName?: string;
  partnerApplicationRef?: string;
  submittedBy: Types.ObjectId;
  submittedAt: Date;
  isVerifiedIntegration: boolean;
  receiptDocumentId?: Types.ObjectId;
  disclaimer: string;
}

export interface IApplicationVersion extends MongooseDocument {
  applicationId: Types.ObjectId;
  versionNumber: number;
  submittedAt: Date;
  submittedBy: Types.ObjectId;
  stageAtSnapshot: string;
  statusSourceAtSnapshot: 'student-reported' | 'staff-verified' | 'provider-confirmed' | 'integration-confirmed';
  snapshotData: Record<string, unknown>;
  immutableChecksum: string;
  submissionReceipt?: ISubmissionReceipt;
  notes?: string;
  createdAt: Date;
}

const SubmissionReceiptSchema = new Schema<ISubmissionReceipt>(
  {
    submissionId: { type: String, required: true },
    method: {
      type: String,
      enum: ['student-manual', 'staff-assisted', 'partner-integration'],
      required: true,
    },
    partnerName: { type: String },
    partnerApplicationRef: { type: String },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submittedAt: { type: Date, default: Date.now },
    isVerifiedIntegration: { type: Boolean, default: false },
    receiptDocumentId: { type: Schema.Types.ObjectId, ref: 'DocumentRecord' },
    disclaimer: { type: String, required: true },
  },
  { _id: false }
);

const ApplicationVersionSchema = new Schema<IApplicationVersion>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    versionNumber: { type: Number, required: true },
    submittedAt: { type: Date, default: Date.now },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    stageAtSnapshot: { type: String, required: true },
    statusSourceAtSnapshot: {
      type: String,
      enum: ['student-reported', 'staff-verified', 'provider-confirmed', 'integration-confirmed'],
      required: true,
    },
    snapshotData: { type: Schema.Types.Mixed, required: true },
    immutableChecksum: { type: String, required: true },
    submissionReceipt: { type: SubmissionReceiptSchema },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ApplicationVersionSchema.index({ applicationId: 1, versionNumber: 1 }, { unique: true });

export const ApplicationVersion = mongoose.model<IApplicationVersion>(
  'ApplicationVersion',
  ApplicationVersionSchema
);
