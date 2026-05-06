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
  
  // Personal & Education Basics
  country?: string;
  currentEducationLevel?: string;
  lastDegreeName?: string;
  institutionName?: string;
  gpa?: number;
  gradingScale?: number;
  workExperienceYears?: number;

  // Preferences
  preferredField?: string;
  preferredLevel?: string;
  preferredStates?: string[];
  preferredCities?: string[];
  intakePreference?: string;
  budgetMaxAud?: number;
  fundingSource?: string;
  scholarshipNeeded?: boolean;

  // Tests
  ieltsOverall?: number;
  toeflTotal?: number;
  pteOverall?: number;
  duolingoScore?: number;
  testStatus?: 'taken' | 'planned' | 'not_needed';

  // Career & Goals
  preferredJobRole?: string;
  targetIndustry?: string;
  postStudyWorkInterest?: boolean;
  migrationInterest?: boolean;

  // Weights & Tracking
  priorityWeights?: IPriorityWeights;
  priorityPreset?: 'balanced' | 'budget' | 'career' | 'prestige' | 'easy-admission' | 'scholarship';
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
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    
    country: String,
    currentEducationLevel: String,
    lastDegreeName: String,
    institutionName: String,
    gpa: Number,
    gradingScale: Number,
    workExperienceYears: Number,

    preferredField: String,
    preferredLevel: String,
    preferredStates: [String],
    preferredCities: [String],
    intakePreference: String,
    budgetMaxAud: Number,
    fundingSource: String,
    scholarshipNeeded: { type: Boolean, default: false },

    ieltsOverall: Number,
    toeflTotal: Number,
    pteOverall: Number,
    duolingoScore: Number,
    testStatus: { type: String, enum: ['taken', 'planned', 'not_needed'] },

    preferredJobRole: String,
    targetIndustry: String,
    postStudyWorkInterest: { type: Boolean, default: true },
    migrationInterest: { type: Boolean, default: false },

    priorityWeights: { type: PriorityWeightsSchema, default: () => ({}) },
    priorityPreset: { 
      type: String, 
      enum: ['balanced', 'budget', 'career', 'prestige', 'easy-admission', 'scholarship'],
      default: 'balanced'
    },
    savedUniversities: [{ type: Schema.Types.ObjectId, ref: 'University' }],
    savedPrograms: [{ type: Schema.Types.ObjectId, ref: 'Program' }],
  },
  { timestamps: true }
);

// Indexes are now defined in the schema fields above

export const StudentProfile = mongoose.model<IStudentProfile>('StudentProfile', StudentProfileSchema);
