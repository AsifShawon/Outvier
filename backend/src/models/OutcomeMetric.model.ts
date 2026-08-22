/**
 * OutcomeMetric.model.ts — Canonical Graduate Outcomes & Experience Metrics Model.
 */
import mongoose, { Document, Schema, Types } from 'mongoose';
import { FieldEvidenceSchema, IFieldEvidence } from './FieldEvidence.model';

export type MetricPublisher = 'QILT' | 'ComparED' | 'GRADUATE_OUTCOMES_SURVEY' | 'MANUAL' | 'OTHER';
export type MetricType =
  | 'teaching_quality'
  | 'student_support'
  | 'learner_engagement'
  | 'learning_resources'
  | 'skills_development'
  | 'overall_experience'
  | 'graduate_employment_rate'
  | 'full_time_employment_rate'
  | 'median_salary_aud';

export interface IOutcomeMetric extends Document {
  provider: Types.ObjectId; // Canonical Ref to University
  universityId: Types.ObjectId; // Legacy alias to University
  program?: Types.ObjectId; // Optional Ref to Program
  publisher: MetricPublisher;
  source: string; // Legacy alias for publisher
  surveyYear: number;
  year: number; // Legacy alias for surveyYear
  metricType?: MetricType;
  metricValue?: number;
  unit?: 'percentage' | 'currency_aud' | 'index_100' | 'rating_5';
  studyLevel?: 'undergraduate' | 'postgraduate';
  fieldOfEducation?: string;
  verificationDate?: Date;

  // Legacy aggregated attributes preserved
  teachingQuality?: number;
  studentSupport?: number;
  learnerEngagement?: number;
  overallExperience?: number;
  graduateEmploymentRate?: number;
  medianSalary?: number;
  graduateSatisfactionRate?: number;

  sourceUrl?: string;
  fetchedAt?: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected';
  confidence?: number;
  sourceEvidence?: IFieldEvidence;
  createdAt: Date;
  updatedAt: Date;
}

const OutcomeMetricSchema = new Schema<IOutcomeMetric>(
  {
    provider: { type: Schema.Types.ObjectId, ref: 'University', required: true, index: true },
    universityId: { type: Schema.Types.ObjectId, ref: 'University', index: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', index: true },
    publisher: {
      type: String,
      enum: ['QILT', 'ComparED', 'GRADUATE_OUTCOMES_SURVEY', 'MANUAL', 'OTHER'],
      default: 'QILT',
      index: true,
    },
    source: { type: String, default: 'QILT' },
    surveyYear: { type: Number, required: true, index: true },
    year: { type: Number },
    metricType: {
      type: String,
      enum: [
        'teaching_quality',
        'student_support',
        'learner_engagement',
        'learning_resources',
        'skills_development',
        'overall_experience',
        'graduate_employment_rate',
        'full_time_employment_rate',
        'median_salary_aud',
      ],
    },
    metricValue: Number,
    unit: { type: String, enum: ['percentage', 'currency_aud', 'index_100', 'rating_5'], default: 'percentage' },
    studyLevel: { type: String, enum: ['undergraduate', 'postgraduate'] },
    fieldOfEducation: String,
    verificationDate: { type: Date, default: Date.now },

    // Legacy fields preserved
    teachingQuality: Number,
    studentSupport: Number,
    learnerEngagement: Number,
    overallExperience: Number,
    graduateEmploymentRate: Number,
    medianSalary: Number,
    graduateSatisfactionRate: Number,
    sourceUrl: String,
    fetchedAt: Date,
    approvedAt: Date,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved', index: true },
    confidence: { type: Number, default: 0.8 },
    sourceEvidence: FieldEvidenceSchema,
  },
  { timestamps: true }
);

// Pre-save synchronization hook
OutcomeMetricSchema.pre('save', function (next) {
  if (this.provider && !this.universityId) {
    this.universityId = this.provider;
  } else if (this.universityId && !this.provider) {
    this.provider = this.universityId;
  }

  if (this.surveyYear && !this.year) {
    this.year = this.surveyYear;
  } else if (this.year && !this.surveyYear) {
    this.surveyYear = this.year;
  }

  if (this.publisher && !this.source) {
    this.source = this.publisher;
  }
  next();
});

OutcomeMetricSchema.index({ provider: 1, publisher: 1, surveyYear: 1 });
OutcomeMetricSchema.index({ universityId: 1, source: 1, year: 1 });

export const OutcomeMetric = mongoose.model<IOutcomeMetric>('OutcomeMetric', OutcomeMetricSchema);
