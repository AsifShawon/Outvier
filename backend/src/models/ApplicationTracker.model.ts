import mongoose, { Document, Schema, Types } from 'mongoose';

export type ApplicationStatus = 
  | 'researching' 
  | 'shortlisted' 
  | 'preparing_documents' 
  | 'applied' 
  | 'offer_received' 
  | 'accepted' 
  | 'visa_process' 
  | 'enrolled' 
  | 'rejected' 
  | 'archived';

export interface IDocumentStatus {
  name: string;
  key: string;
  status: 'pending' | 'completed' | 'not_required';
  fileUrl?: string;
  updatedAt: Date;
}

export interface ITask {
  title: string;
  completed: boolean;
  dueDate?: Date;
}

export interface IHistoryEvent {
  status: ApplicationStatus;
  note?: string;
  updatedBy?: string;
  updatedAt: Date;
}

export interface IApplicationTracker extends Document {
  userId: Types.ObjectId;
  programId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  customProgramName?: string;
  customUniversityName?: string;
  status: ApplicationStatus;
  priority: 'low' | 'medium' | 'high';
  intake?: string;
  deadline?: Date;
  notes?: string;
  documentChecklist: IDocumentStatus[];
  tasks: ITask[];
  history: IHistoryEvent[];
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationTrackerSchema = new Schema<IApplicationTracker>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    customProgramName: { type: String },
    customUniversityName: { type: String },
    status: {
      type: String,
      enum: [
        'researching', 'shortlisted', 'preparing_documents', 'applied', 
        'offer_received', 'accepted', 'visa_process', 'enrolled', 'rejected', 'archived'
      ],
      default: 'researching',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    intake: { type: String },
    deadline: { type: Date },
    notes: { type: String },
    documentChecklist: [
      {
        name: String,
        key: String,
        status: { type: String, enum: ['pending', 'completed', 'not_required'], default: 'pending' },
        fileUrl: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        title: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
      },
    ],
    history: [
      {
        status: String,
        note: String,
        updatedBy: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate tracking of the same program for the same user if programId exists
ApplicationTrackerSchema.index({ userId: 1, programId: 1 }, { 
  unique: true, 
  partialFilterExpression: { programId: { $exists: true } } 
});
ApplicationTrackerSchema.index({ status: 1 });

export const ApplicationTracker = mongoose.model<IApplicationTracker>('ApplicationTracker', ApplicationTrackerSchema);
