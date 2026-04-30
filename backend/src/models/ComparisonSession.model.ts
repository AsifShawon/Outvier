import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComparisonSession extends Document {
  userId?: Types.ObjectId;
  sessionKey?: string;   // anonymous user session
  selectedUniversityIds: Types.ObjectId[];
  selectedProgramIds: Types.ObjectId[];
  generatedScores?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ComparisonSessionSchema = new Schema<IComparisonSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    sessionKey: { type: String, sparse: true, index: true },
    selectedUniversityIds: [{ type: Schema.Types.ObjectId, ref: 'University' }],
    selectedProgramIds: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
    generatedScores: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ComparisonSessionSchema.index({ userId: 1, createdAt: -1 });
// sessionKey index is now defined in the schema field above

export const ComparisonSession = mongoose.model<IComparisonSession>('ComparisonSession', ComparisonSessionSchema);
