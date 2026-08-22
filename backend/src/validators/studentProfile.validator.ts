import { z } from 'zod';

export const updateStudentProfileSchema = z.object({
  country: z.string().trim().max(100).optional(),
  currentEducationLevel: z.string().trim().max(100).optional(),
  lastDegreeName: z.string().trim().max(200).optional(),
  institutionName: z.string().trim().max(200).optional(),
  gpa: z.number().min(0).max(100).optional(),
  gradingScale: z.number().min(1).max(100).optional(),
  workExperienceYears: z.number().min(0).max(50).optional(),

  preferredField: z.string().trim().max(100).optional(),
  preferredLevel: z.string().trim().max(100).optional(),
  preferredStates: z.array(z.string().trim().max(50)).optional(),
  preferredCities: z.array(z.string().trim().max(100)).optional(),
  intakePreference: z.string().trim().max(100).optional(),
  budgetMaxAud: z.number().min(0).optional(),
  fundingSource: z.string().trim().max(100).optional(),
  scholarshipNeeded: z.boolean().optional(),

  ieltsOverall: z.number().min(0).max(9).optional(),
  toeflTotal: z.number().min(0).max(120).optional(),
  pteOverall: z.number().min(0).max(90).optional(),
  duolingoScore: z.number().min(0).max(160).optional(),
  testStatus: z.enum(['taken', 'planned', 'not_needed']).optional(),

  preferredJobRole: z.string().trim().max(150).optional(),
  targetIndustry: z.string().trim().max(150).optional(),
  postStudyWorkInterest: z.boolean().optional(),
  migrationInterest: z.boolean().optional(),

  priorityPreset: z.enum(['balanced', 'budget', 'career', 'prestige', 'easy-admission', 'scholarship']).optional(),
  priorityWeights: z.object({
    affordability: z.number().min(0).max(100).optional(),
    ranking: z.number().min(0).max(100).optional(),
    employability: z.number().min(0).max(100).optional(),
    admissionMatch: z.number().min(0).max(100).optional(),
    location: z.number().min(0).max(100).optional(),
    scholarship: z.number().min(0).max(100).optional(),
  }).optional(),
}).strict(); // Disallow arbitrary extra fields!

export const saveUniversitySchema = z.object({
  universityId: z.string().min(1, 'universityId is required'),
});

export const saveProgramSchema = z.object({
  programId: z.string().min(1, 'programId is required'),
});

export type UpdateStudentProfileDTO = z.infer<typeof updateStudentProfileSchema>;
