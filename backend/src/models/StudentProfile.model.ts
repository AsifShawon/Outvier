import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPriorityWeights {
  affordability: number;
  ranking: number;
  employability: number;
  admissionMatch: number;
  location: number;
  scholarship: number;
}

export interface IStudentProfile extends Document {
  userId?: Types.ObjectId;
  preferredField?: string;
  preferredLevel?: string;
  budgetMaxAud?: number;
  preferredStates?: string[];
  ieltsScore?: number;
  pteScore?: number;
  academicBackground?: string;
  priorityWeights?: IPriorityWeights;
  savedUniversities?: Types.ObjectId[];
  savedPrograms?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const PriorityWeightsSchema = new Schema<IPriorityWeights>(
  {
    affordability: { type: Number, default: 30 },
    ranking: { type: Number, default: 20 },
    employability: { type: Number, default: 20 },
    admissionMatch: { type: Number, default: 15 },
    location: { type: Number, default: 10 },
    scholarship: { type: Number, default: 5 },
  },
  { _id: false }
);

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true },
    preferredField: String,
    preferredLevel: String,
    budgetMaxAud: Number,
    preferredStates: [String],
    ieltsScore: Number,
    pteScore: Number,
    academicBackground: String,
    priorityWeights: { type: PriorityWeightsSchema, default: () => ({}) },
    savedUniversities: [{ type: Schema.Types.ObjectId, ref: 'University' }],
    savedPrograms: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
  },
  { timestamps: true }
);

StudentProfileSchema.index({ userId: 1 });

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
