import mongoose, { Document, Schema } from 'mongoose';

export interface IUniversity extends Document {
  name: string;
  slug: string;
  description: string;
  location: string;
  state: string;
  website: string;
  logo?: string;
  establishedYear?: number;
  ranking?: number;
  type: 'public' | 'private';
  campuses?: string[];
  internationalStudents?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UniversitySchema = new Schema<IUniversity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    state: { type: String, required: true },
    website: { type: String, required: true },
    logo: { type: String },
    establishedYear: { type: Number },
    ranking: { type: Number },
    type: { type: String, enum: ['public', 'private'], required: true },
    campuses: [{ type: String }],
    internationalStudents: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UniversitySchema.index({ name: 'text', description: 'text', location: 'text' });

export const University = mongoose.model<IUniversity>('University', UniversitySchema);
