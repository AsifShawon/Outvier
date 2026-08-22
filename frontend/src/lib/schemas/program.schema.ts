import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers (same pattern as university.schema.ts)
// ---------------------------------------------------------------------------

const optionalNumericString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? Number(v) : undefined))
  .pipe(z.number().nonnegative().optional());

const csvToArray = z
  .string()
  .optional()
  .transform((v) =>
    v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []
  );

// ---------------------------------------------------------------------------
// Section schemas
// ---------------------------------------------------------------------------

export const programIdentitySchema = z.object({
  /** Full program name */
  name: z.string().min(2, 'Name must be at least 2 characters'),
  /** Field of study */
  field: z.string().min(2, 'Field of study is required'),
  /** Description / overview */
  description: z.string().optional(),
  /** Internal publication status */
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const programProviderSchema = z.object({
  /** University ID */
  university: z.string().min(1, 'University is required'),
  /** Academic level */
  level: z.enum([
    'bachelor',
    'master',
    'phd',
    'diploma',
    'certificate',
    'graduate_certificate',
    'secondary',
    'elicos',
    'non_award',
    'other',
  ]),
  /** Delivery mode */
  campusMode: z.enum(['on-campus', 'online', 'hybrid']),
  /** Duration string e.g. "3 years full-time" */
  duration: z.string().optional(),
});

export const programCricosSchema = z.object({
  /** CRICOS course code — when present, enables CRICOS sub-fields */
  cricosCourseCode: z.string().optional(),
  /** Provider code (may be inherited from university) */
  cricosProviderCode: z.string().optional(),
  /** CRICOS-reported course level */
  courseLevel: z.string().optional(),
  /** Whether the CRICOS listing has expired */
  expired: z.boolean().optional().default(false),
});

export const programDeliverySchema = z.object({
  /** Language of instruction */
  courseLanguage: z.string().optional(),
  /** Work-integrated learning component description */
  workComponent: z.string().optional(),
  /** Work component hours per week — stored as string, output as number */
  workComponentHoursPerWeek: optionalNumericString,
  /** VET national code for vocational programs */
  vetNationalCode: z.string().optional(),
});

export const programFeesSchema = z.object({
  /** Domestic annual tuition (AUD) */
  tuitionFeeLocal: optionalNumericString,
  /** International annual tuition (AUD) */
  tuitionFeeInternational: optionalNumericString,
  /** CRICOS-reported tuition (AUD) */
  tuitionFeeAud: optionalNumericString,
  /** Non-tuition fees (AUD) */
  nonTuitionFeeAud: optionalNumericString,
  /** Total estimated course cost (AUD) */
  estimatedTotalCourseCostAud: optionalNumericString,
});

export const programIntakesSchema = z.object({
  /** Intake months — CSV in form, string[] on output */
  intakeMonths: csvToArray,
  /** Duration in weeks (for CRICOS) */
  durationWeeks: optionalNumericString,
});

export const programEntrySchema = z.object({
  /** Free-text academic requirements */
  academicRequirements: z.string().optional(),
  /** Minimum GPA */
  minimumGPA: optionalNumericString,
  /** Whether this is a dual qualification */
  dualQualification: z.boolean().optional().default(false),
  /** Whether foundation studies are included */
  foundationStudies: z.boolean().optional().default(false),
});

export const programEnglishSchema = z.object({
  /** Free-text English requirements summary */
  englishRequirements: z.string().optional(),
});

export const programEvidenceSchema = z.object({
  /** Data source name */
  sourceName: z.string().optional(),
  /** Source resource / record ID */
  sourceResourceId: z.string().optional(),
  /** How the data was imported */
  importMethod: z.string().optional(),
  /** Data confidence score 0-1 */
  confidence: optionalNumericString,
});

export const programPublicationSchema = z.object({
  /** Career pathways — CSV in form, string[] on output */
  careerPathways: csvToArray,
  /** Program website URL */
  website: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
});

// ---------------------------------------------------------------------------
// Full schema
// ---------------------------------------------------------------------------

export const programFormSchema = programIdentitySchema
  .merge(programProviderSchema)
  .merge(programCricosSchema)
  .merge(programDeliverySchema)
  .merge(programFeesSchema)
  .merge(programIntakesSchema)
  .merge(programEntrySchema)
  .merge(programEnglishSchema)
  .merge(programEvidenceSchema)
  .merge(programPublicationSchema);

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

export type ProgramFormInput = z.input<typeof programFormSchema>;
export type ProgramFormOutput = z.output<typeof programFormSchema>;

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

export const programFormDefaults: ProgramFormInput = {
  name: '',
  field: '',
  description: '',
  status: 'draft',
  university: '',
  level: 'bachelor',
  campusMode: 'on-campus',
  duration: '',
  cricosCourseCode: '',
  cricosProviderCode: '',
  courseLevel: '',
  expired: false,
  courseLanguage: '',
  workComponent: '',
  workComponentHoursPerWeek: '',
  vetNationalCode: '',
  tuitionFeeLocal: '',
  tuitionFeeInternational: '',
  tuitionFeeAud: '',
  nonTuitionFeeAud: '',
  estimatedTotalCourseCostAud: '',
  intakeMonths: '',
  durationWeeks: '',
  academicRequirements: '',
  minimumGPA: '',
  dualQualification: false,
  foundationStudies: false,
  englishRequirements: '',
  sourceName: '',
  sourceResourceId: '',
  importMethod: '',
  confidence: '',
  careerPathways: '',
  website: '',
};

// ---------------------------------------------------------------------------
// Label constants (used in form + error summary)
// ---------------------------------------------------------------------------

export const PROGRAM_LEVELS = [
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'graduate_certificate', label: 'Graduate Certificate' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'elicos', label: 'ELICOS' },
  { value: 'non_award', label: 'Non-Award' },
  { value: 'other', label: 'Other' },
] as const;

export const CAMPUS_MODES = [
  { value: 'on-campus', label: 'On Campus' },
  { value: 'online', label: 'Online' },
  { value: 'hybrid', label: 'Hybrid' },
] as const;
