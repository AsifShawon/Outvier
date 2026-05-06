import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBudgetPlan extends Document {
  userId: Types.ObjectId;
  title: string;
  state?: string;
  city?: string;
  tuitionPerYear: number;
  durationYears: number;
  accommodationType: string;
  monthlyRent: number;
  monthlyFood: number;
  monthlyTransport: number;
  monthlyUtilities: number;
  monthlyInsurance: number;
  yearlyOther: number;
  scholarshipAmount: number;
  partTimeIncome: number;
  totalEstimatedFirstYear: number;
  totalEstimatedProgram: number;
  savedAt: Date;
}

const BudgetPlanSchema = new Schema<IBudgetPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    state: { type: String },
    city: { type: String },
    tuitionPerYear: { type: Number, default: 0 },
    durationYears: { type: Number, default: 1 },
    accommodationType: { type: String },
    monthlyRent: { type: Number, default: 0 },
    monthlyFood: { type: Number, default: 0 },
    monthlyTransport: { type: Number, default: 0 },
    monthlyUtilities: { type: Number, default: 0 },
    monthlyInsurance: { type: Number, default: 0 },
    yearlyOther: { type: Number, default: 0 },
    scholarshipAmount: { type: Number, default: 0 },
    partTimeIncome: { type: Number, default: 0 },
    totalEstimatedFirstYear: { type: Number, default: 0 },
    totalEstimatedProgram: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const BudgetPlan = mongoose.model<IBudgetPlan>('BudgetPlan', BudgetPlanSchema);
