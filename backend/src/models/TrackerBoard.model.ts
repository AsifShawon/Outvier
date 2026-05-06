import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ITrackerColumn {
  id: string;
  title: string;
  color?: string;
  order: number;
  isArchived: boolean;
}

export interface ITrackerBoard extends Document {
  userId: Types.ObjectId;
  name: string;
  columns: ITrackerColumn[];
  settings: {
    showDeadlines: boolean;
    showPriority: boolean;
    showDocuments: boolean;
    showTasks: boolean;
    compactMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TrackerColumnSchema = new Schema<ITrackerColumn>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  color: { type: String },
  order: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false }
}, { _id: false, timestamps: true });

const TrackerBoardSchema = new Schema<ITrackerBoard>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, default: 'My Application Tracker' },
    columns: [TrackerColumnSchema],
    settings: {
      showDeadlines: { type: Boolean, default: true },
      showPriority: { type: Boolean, default: true },
      showDocuments: { type: Boolean, default: true },
      showTasks: { type: Boolean, default: true },
      compactMode: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

TrackerBoardSchema.index({ userId: 1 });

export const TrackerBoard = mongoose.model<ITrackerBoard>('TrackerBoard', TrackerBoardSchema);
