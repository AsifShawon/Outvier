import mongoose, { Document, Schema } from 'mongoose';

export type UploadStatus = 'preview' | 'confirmed' | 'cancelled' | 'processing' | 'completed' | 'failed';
export type UploadEntity = 'universities' | 'programs' | 'other';

export interface IUploadJob extends Document {
  entity: UploadEntity;
  originalFilename: string;
  filename?: string; // alias for originalFilename
  uploadedBy?: mongoose.Types.ObjectId;
  status: UploadStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  successCount?: number; // same as validRows
  errorCount?: number; // same as invalidRows
  duplicateRows: number;
  previewRows: any[];
  rowErrors: { row: number; message: string }[];
  confirmedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UploadJobSchema = new Schema<IUploadJob>(
  {
    entity: { type: String, enum: ['universities', 'programs', 'other'], required: true },
    originalFilename: { type: String, required: true },
    filename: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['preview', 'confirmed', 'cancelled', 'processing', 'completed', 'failed'], default: 'preview' },
    totalRows: { type: Number, default: 0 },
    validRows: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    invalidRows: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    duplicateRows: { type: Number, default: 0 },
    previewRows: [{ type: Schema.Types.Mixed }],
    rowErrors: [{ row: Number, message: String }],
    confirmedAt: { type: Date },
  },
  { timestamps: true }
);

export const UploadJob = mongoose.model<IUploadJob>('UploadJob', UploadJobSchema);
