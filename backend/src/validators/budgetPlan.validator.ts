import { z } from 'zod';

export const createBudgetPlanSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  state: z.string().trim().max(50).optional(),
  city: z.string().trim().max(100).optional(),
  tuitionPerYear: z.number().min(0).default(0),
  durationYears: z.number().min(0.5).max(10).default(1),
  accommodationType: z.string().trim().max(100).optional(),
  monthlyRent: z.number().min(0).default(0),
  monthlyFood: z.number().min(0).default(0),
  monthlyTransport: z.number().min(0).default(0),
  monthlyUtilities: z.number().min(0).default(0),
  monthlyInsurance: z.number().min(0).default(0),
  yearlyOther: z.number().min(0).default(0),
  scholarshipAmount: z.number().min(0).default(0),
  partTimeIncome: z.number().min(0).default(0),
  totalEstimatedFirstYear: z.number().min(0).default(0),
  totalEstimatedProgram: z.number().min(0).default(0),
}).strict();

export const updateBudgetPlanSchema = createBudgetPlanSchema.partial().strict();

export type CreateBudgetPlanDTO = z.infer<typeof createBudgetPlanSchema>;
export type UpdateBudgetPlanDTO = z.infer<typeof updateBudgetPlanSchema>;
