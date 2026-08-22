import { z } from 'zod';

// ---------------------------------------------------------------------------
// Profile form schema
// ---------------------------------------------------------------------------

export const profileFormSchema = z.object({
  /** Preferred field of study */
  preferredField: z.string().optional(),
  /** Preferred study level */
  preferredLevel: z
    .enum(['bachelor', 'master', 'phd', 'diploma', 'certificate', 'graduate_certificate'])
    .default('master'),
  /** Maximum annual budget in AUD */
  budgetMaxAud: z
    .number()
    .int()
    .min(15000)
    .max(200000)
    .default(40000),
  /** Preferred Australian states */
  preferredStates: z.array(z.string()).default([]),
  /** IELTS overall band score */
  ieltsScore: z
    .number()
    .min(0)
    .max(9)
    .step(0.5)
    .optional(),
  /** PTE Academic score */
  pteScore: z
    .number()
    .int()
    .min(0)
    .max(90)
    .optional(),
  /** Free-text academic background */
  academicBackground: z.string().optional(),
  /** Career goals sub-object */
  careerGoals: z
    .object({
      targetRole: z.string().optional(),
      migrationInterest: z.boolean().default(false),
      fundingSource: z
        .enum(['self', 'loan', 'scholarship', 'family'])
        .default('family'),
    })
    .default({
      targetRole: '',
      migrationInterest: false,
      fundingSource: 'family',
    }),
});

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type ProfileFormInput = z.input<typeof profileFormSchema>;
export type ProfileFormOutput = z.output<typeof profileFormSchema>;

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const profileFormDefaults: ProfileFormInput = {
  preferredField: '',
  preferredLevel: 'master',
  budgetMaxAud: 40000,
  preferredStates: [],
  ieltsScore: undefined,
  pteScore: undefined,
  academicBackground: '',
  careerGoals: {
    targetRole: '',
    migrationInterest: false,
    fundingSource: 'family',
  },
};

// ---------------------------------------------------------------------------
// Step definitions (used by Stepper)
// ---------------------------------------------------------------------------

export const PROFILE_STEPS = [
  {
    id: 'academic',
    title: 'Academic Profile',
    description: 'Education & Language',
  },
  {
    id: 'goals',
    title: 'Future Goals',
    description: 'Career & Finance',
  },
] as const;

export type ProfileStepId = (typeof PROFILE_STEPS)[number]['id'];
