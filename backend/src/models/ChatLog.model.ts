import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatLog extends Document {
  userId?: Types.ObjectId;
  sessionKey?: string;
  provider?: string;
  aiModel?: string;
  question: string;
  answer: string;
  retrievedContextIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatLogSchema = new Schema<IChatLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    sessionKey: String,
    provider: String,
    aiModel: String,
    question: { type: String, required: true },
    answer: { type: String, required: true },
    retrievedContextIds: [String],
  },
  { timestamps: true }
);

ChatLogSchema.index({ userId: 1, createdAt: -1 });
ChatLogSchema.index({ sessionKey: 1, createdAt: -1 });

export const ChatLog = mongoose.model<IChatLog>('ChatLog', ChatLogSchema);
