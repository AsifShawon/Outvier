import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDocumentStatus {
  id: string;
  name: string;
  status: 'pending' | 'preparing' | 'uploaded' | 'submitted' | 'verified' | 'completed' | 'not_required';
  fileUrl?: string;
  notes?: string;
  updatedAt: Date;
}

export interface ITask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: Date;
  category?: string;
  order?: number;
  createdAt: Date;
}

export interface IHistoryEvent {
  type: 'created' | 'moved' | 'edited' | 'document_updated' | 'task_updated' | 'archived' | 'reminder_set' | 'note_updated';
  fromColumnId?: string;
  toColumnId?: string;
  note?: string;
  updatedAt: Date;
}

export interface IReminder {
  id: string;
  type: 'deadline' | 'document' | 'interview' | 'visa' | 'payment' | 'custom';
  title: string;
  date: Date;
  note?: string;
  completed: boolean;
}

export interface IApplicationTracker extends Document {
  userId: Types.ObjectId;
  boardId: Types.ObjectId;
  columnId: string;
  order: number;
  itemType: 'university' | 'program' | 'scholarship' | 'visa' | 'custom';
  programId?: Types.ObjectId;
  universityId?: Types.ObjectId;
  customProgramName?: string;
  customUniversityName?: string;
  title: string;
  subtitle?: string;
  description?: string;
  country?: string;
  status?: string; // Kept for backward compatibility migration
  priority: 'low' | 'medium' | 'high';
  intake?: string;
  deadline?: Date;
  applicationUrl?: string;
  notes?: string;
  tags: string[];
  documentChecklist: IDocumentStatus[];
  tasks: ITask[];
  reminders: IReminder[];
  history: IHistoryEvent[];
  archived: boolean;
  archivedAt?: Date;
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
      enum: ['university', 'program', 'scholarship', 'visa', 'custom'],
      default: 'program'
    },
    programId: { type: Schema.Types.ObjectId, ref: 'Program' },
    universityId: { type: Schema.Types.ObjectId, ref: 'University' },
    customProgramName: { type: String },
    customUniversityName: { type: String },
    title: { type: String, required: true },
    subtitle: { type: String },
    description: { type: String },
    country: { type: String },
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
        status: {
          type: String,
          enum: ['pending', 'preparing', 'uploaded', 'submitted', 'verified', 'completed', 'not_required'],
          default: 'pending'
        },
        fileUrl: String,
        notes: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        id: String,
        title: String,
        completed: { type: Boolean, default: false },
        dueDate: Date,
        category: String,
        order: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reminders: [
      {
        id: String,
        type: { type: String, enum: ['deadline', 'document', 'interview', 'visa', 'payment', 'custom'], default: 'custom' },
        title: String,
        date: Date,
        note: String,
        completed: { type: Boolean, default: false },
      }
    ],
    history: [
      {
        type: {
          type: String,
          enum: ['created', 'moved', 'edited', 'document_updated', 'task_updated', 'archived', 'reminder_set', 'note_updated'],
          default: 'created'
        },
        fromColumnId: String,
        toColumnId: String,
        note: String,
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

// Indexes
ApplicationTrackerSchema.index({ userId: 1, boardId: 1 });
ApplicationTrackerSchema.index({ userId: 1, columnId: 1 });
ApplicationTrackerSchema.index({ userId: 1, archived: 1 });
ApplicationTrackerSchema.index({ boardId: 1, columnId: 1, order: 1 });
ApplicationTrackerSchema.index({ userId: 1, deadline: 1 });

// Partial index for program tracking if programId exists
ApplicationTrackerSchema.index({ userId: 1, programId: 1 }, {
  unique: true,
  partialFilterExpression: { programId: { $exists: true }, archived: false }
});

export const ApplicationTracker = mongoose.model<IApplicationTracker>('ApplicationTracker', ApplicationTrackerSchema);
