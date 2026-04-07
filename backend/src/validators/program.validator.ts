import { z } from 'zod';

const programLevels = ['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate'] as const;
const campusModes = ['on-campus', 'online', 'hybrid'] as const;

export const createProgramSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  university: z.string().min(1, 'University ID is required'),
  level: z.enum(programLevels),
  field: z.string().min(2, 'Field is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  duration: z.string().min(1, 'Duration is required'),
  tuitionFeeLocal: z.number().min(0).optional(),
  tuitionFeeInternational: z.number().min(0).optional(),
  intakeMonths: z.array(z.string()).optional(),
  englishRequirements: z.string().optional(),
  academicRequirements: z.string().optional(),
  careerPathways: z.array(z.string()).optional(),
  campusMode: z.enum(campusModes).default('on-campus'),
  website: z.string().url().optional().or(z.literal('')),
});

export const updateProgramSchema = createProgramSchema.partial();

export type CreateProgramDTO = z.infer<typeof createProgramSchema>;
export type UpdateProgramDTO = z.infer<typeof updateProgramSchema>;
