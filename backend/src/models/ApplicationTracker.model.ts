import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApplicationStatus = 'researching' | 'preparing' | 'submitted' | 'accepted' | 'rejected' | 'enrolled';

export interface IApplicationTracker extends Document {
  userId: Types.ObjectId;
  programId: Types.ObjectId;
  universityId: Types.ObjectId;
  status: ApplicationStatus;
  notes?: string;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationTrackerSchema = new Schema<IApplicationTracker>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    status: {
      type: String,
      enum: ['researching', 'preparing', 'submitted', 'accepted', 'rejected', 'enrolled'],
      default: 'researching',
    },
    notes: { type: String },
    deadline: { type: Date },
  },
  { timestamps: true }
);

// Prevent duplicate tracking of the same program for the same user
ApplicationTrackerSchema.index({ userId: 1, programId: 1 }, { unique: true });
ApplicationTrackerSchema.index({ status: 1 });

export const ApplicationTracker = mongoose.model<IApplicationTracker>('ApplicationTracker', ApplicationTrackerSchema);
