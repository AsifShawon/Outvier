import mongoose, { Document, Schema } from 'mongoose';

export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type UploadEntity = 'universities' | 'programs';

export interface IUploadJob extends Document {
  entity: UploadEntity;
  filename: string;
  status: UploadStatus;
  totalRows: number;
  successCount: number;
  errorCount: number;
  rowErrors: { row: number; message: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const UploadJobSchema = new Schema<IUploadJob>(
  {
    entity: { type: String, enum: ['universities', 'programs'], required: true },
    filename: { type: String, required: true },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
    totalRows: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    rowErrors: [{ row: Number, message: String }],
  },
  { timestamps: true }
);

export const UploadJob = mongoose.model<IUploadJob>('UploadJob', UploadJobSchema);
