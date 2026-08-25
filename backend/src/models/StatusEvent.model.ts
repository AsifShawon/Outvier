import mongoose, { Document as MongooseDocument, Schema, Types } from 'mongoose';

export type StatusSource =
  | 'student-reported'
  | 'staff-verified'
  | 'provider-confirmed'
  | 'integration-confirmed';

export interface IStatusEvent extends MongooseDocument {
  applicationId: Types.ObjectId;
  fromStage: string;
  toStage: string;
  fromStatusSource?: StatusSource;
  toStatusSource: StatusSource;
  changedBy: Types.ObjectId;
  changedByRole: 'user' | 'admin' | 'system' | 'integration';
  actorName?: string;
  reason?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const StatusEventSchema = new Schema<IStatusEvent>(
  {
    applicationId: { type: Schema.Types.ObjectId, ref: 'Application', required: true, index: true },
    fromStage: { type: String, required: true },
    toStage: { type: String, required: true },
    fromStatusSource: {
      type: String,
      enum: ['student-reported', 'staff-verified', 'provider-confirmed', 'integration-confirmed'],
    },
    toStatusSource: {
      type: String,
      enum: ['student-reported', 'staff-verified', 'provider-confirmed', 'integration-confirmed'],
      required: true,
    },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    changedByRole: {
      type: String,
      enum: ['user', 'admin', 'system', 'integration'],
      required: true,
    },
    actorName: { type: String },
    reason: { type: String, maxlength: 500 },
    notes: { type: String, maxlength: 2000 },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StatusEventSchema.index({ applicationId: 1, createdAt: -1 });

export const StatusEvent = mongoose.model<IStatusEvent>('StatusEvent', StatusEventSchema);
