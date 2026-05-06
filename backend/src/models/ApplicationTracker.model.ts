import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDocumentStatus {
  id: string;
  name: string;
  status: 'pending' | 'completed' | 'not_required';
  fileUrl?: string;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  createdAt: Date;
}

export interface IHistoryEvent {
  type: 'created' | 'moved' | 'edited' | 'document_updated' | 'task_updated' | 'archived';
  fromColumnId?: string;
  toColumnId?: string;
  note?: string;
  updatedAt: Date;
}

export interface IApplicationTracker extends Document {
  userId: Types.ObjectId;
  boardId: Types.ObjectId;
  columnId: string;
  order: number;
  itemType: 'university' | 'program' | 'custom';
  programId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  customProgramName?: string;
  customUniversityName?: string;
  title: string;
  subtitle?: string;
  status?: string; // Kept for backward compatibility migration
  priority: 'low' | 'medium' | 'high';
  intake?: string;
  deadline?: Date;
  applicationUrl?: string;
  notes?: string;
  tags: string[];
  documentChecklist: IDocumentStatus[];
  tasks: ITask[];
  history: IHistoryEvent[];
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationTrackerSchema = new Schema<IApplicationTracker>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    boardId: { type: Schema.Types.ObjectId, ref: 'TrackerBoard' },
    columnId: { type: String, required: true },
    order: { type: Number, default: 0 },
    itemType: { 
      type: String, 
      enum: ['university', 'program', 'custom'], 
      default: 'program' 
    },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    customProgramName: { type: String },
    customUniversityName: { type: String },
    title: { type: String, required: true },
    subtitle: { type: String },
    status: { type: String }, // Legacy field
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    intake: { type: String },
    deadline: { type: Date },
    applicationUrl: { type: String },
    notes: { type: String },
    tags: [{ type: String }],
    documentChecklist: [
      {
        id: String,
        name: String,
        status: { type: String, enum: ['pending', 'completed', 'not_required'], default: 'pending' },
        fileUrl: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        id: String,
        title: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    history: [
      {
        type: { 
          type: String, 
          enum: ['created', 'moved', 'edited', 'document_updated', 'task_updated', 'archived'],
          default: 'created'
        },
        fromColumnId: String,
        toColumnId: String,
        note: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    archived: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes
ApplicationTrackerSchema.index({ userId: 1, boardId: 1 });
ApplicationTrackerSchema.index({ userId: 1, columnId: 1 });
ApplicationTrackerSchema.index({ userId: 1, archived: 1 });
ApplicationTrackerSchema.index({ boardId: 1, columnId: 1, order: 1 });

// Partial index for program tracking if programId exists
ApplicationTrackerSchema.index({ userId: 1, programId: 1 }, { 
  unique: true, 
  partialFilterExpression: { programId: { $exists: true }, archived: false } 
});

export const ApplicationTracker = mongoose.model<IApplicationTracker>('ApplicationTracker', ApplicationTrackerSchema);

