import mongoose, { Document, Schema } from 'mongoose';

export type ActivityType = 
  | 'USER_SIGNUP' 
  | 'USER_LOGIN' 
  | 'UNIVERSITY_ADDED' 
  | 'UNIVERSITY_EDITED' 
  | 'PROGRAM_ADDED' 
  | 'PROGRAM_EDITED' 
  | 'STAGED_CHANGE_APPROVED' 
  | 'STAGED_CHANGE_REJECTED' 
  | 'SYNC_JOB_COMPLETED' 
  | 'SYNC_JOB_FAILED' 
  | 'SCHOLARSHIP_ADDED';

export interface IActivity extends Document {
  type: ActivityType;
  title: string;
  description: string;
  actorName?: string;
  actorRole?: string;
  actorId?: mongoose.Types.ObjectId;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    actorName: { type: String },
    actorRole: { type: String },
    actorId: { type: Schema.Types.ObjectId, ref: 'User' },
    entityType: { type: String },
    entityId: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ActivitySchema.index({ createdAt: -1 });

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
