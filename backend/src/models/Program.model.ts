import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IProgram extends Document {
  name: string;
  slug: string;
  university: Types.ObjectId;
  universityName: string;
  universitySlug: string;
  level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate' | 'graduate_certificate';
  field: string;
  description: string;
  duration: string;
  tuitionFeeLocal?: number;
  tuitionFeeInternational?: number;
  intakeMonths?: string[];
  englishRequirements?: string;
  academicRequirements?: string;
  careerPathways?: string[];
  campusMode: 'on-campus' | 'online' | 'hybrid';
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    universityName: { type: String, required: true },
    universitySlug: { type: String, required: true },
    level: {
      type: String,
      enum: ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate'],
      required: true,
    },
    field: { type: String, required: true },
    description: { type: String, required: true },
    duration: { type: String, required: true },
    tuitionFeeLocal: { type: Number },
    tuitionFeeInternational: { type: Number },
    intakeMonths: [{ type: String }],
    englishRequirements: { type: String },
    academicRequirements: { type: String },
    careerPathways: [{ type: String }],
    campusMode: { type: String, enum: ['on-campus', 'online', 'hybrid'], default: 'on-campus' },
    website: { type: String },
  },
  { timestamps: true }
);

ProgramSchema.index({ name: 'text', description: 'text', field: 'text' });

export const Program = mongoose.model<IProgram>('Program', ProgramSchema);
