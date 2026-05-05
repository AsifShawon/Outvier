/**
 * ingestion.schema.ts
 * Strict Zod schemas for the Outvier AI-assisted ingestion pipeline.
 * Every AI extraction output is validated against these schemas.
 */
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Source types
// ---------------------------------------------------------------------------

export const SourceTypeEnum = z.enum([
  'CRICOS',
  'TEQSA',
  'UNIVERSITY_OFFICIAL',
  'FEE_PAGE',
  'REQUIREMENT_PAGE',
  'SCHOLARSHIP_PAGE',
  'GOVERNMENT',
  'SECONDARY',
]);
export type SourceType = z.infer<typeof SourceTypeEnum>;

// ---------------------------------------------------------------------------
// Field Evidence — per-field source citation
// ---------------------------------------------------------------------------

export const FieldEvidenceSchema = z.object({
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
  sourceUrl: z.string().url().or(z.literal('')),
  sourceType: SourceTypeEnum,
  confidence: z.number().min(0).max(100),
  rawTextSnippet: z.string().max(2000).optional(),
  extractedAt: z.string().datetime().optional(),
});
export type FieldEvidence = z.infer<typeof FieldEvidenceSchema>;

// ---------------------------------------------------------------------------
// Extraction Warning
// ---------------------------------------------------------------------------

export const ExtractionWarningSchema = z.object({
  field: z.string(),
  message: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});
export type ExtractionWarning = z.infer<typeof ExtractionWarningSchema>;

// ---------------------------------------------------------------------------
// English Requirement sub-schema
// ---------------------------------------------------------------------------

export const EnglishRequirementsSchema = z.object({
  ieltsOverall: z.number().nullable().optional(),
  ieltsBandMin: z.number().nullable().optional(),
  toefl: z.number().nullable().optional(),
  pte: z.number().nullable().optional(),
  duolingo: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  sourceUrl: z.string().url().or(z.literal('')).nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Tuition sub-schema
// ---------------------------------------------------------------------------

export const TuitionSchema = z.object({
  annualTuitionFee: z.number().nullable().optional(),
  totalEstimatedTuitionFee: z.number().nullable().optional(),
  currency: z.string().default('AUD'),
  feeYear: z.string().nullable().optional(),
  applicationFee: z.number().nullable().optional(),
  indicativeLivingCost: z.number().nullable().optional(),
  additionalCosts: z.record(z.string(), z.number().nullable()).nullable().optional(),
  sourceUrl: z.string().url().or(z.literal('')).nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Intake sub-schema
// ---------------------------------------------------------------------------

export const IntakeSchema = z.object({
  months: z.array(z.string()).nullable().optional(),
  semesterAvailability: z.array(z.string()).nullable().optional(),
  applicationDeadline: z.string().nullable().optional(),
  internationalDeadline: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  nextAvailableIntake: z.string().nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Scholarship sub-schema
// ---------------------------------------------------------------------------

export const ScholarshipInfoSchema = z.object({
  available: z.boolean().nullable().default(false),
  names: z.array(z.string()).nullable().optional(),
  url: z.string().url().or(z.literal('')).nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Career Outcomes sub-schema
// ---------------------------------------------------------------------------

export const CareerOutcomesSchema = z.object({
  opportunities: z.array(z.string()).nullable().optional(),
  jobRoles: z.array(z.string()).nullable().optional(),
  industryPathways: z.array(z.string()).nullable().optional(),
  accreditation: z.array(z.string()).nullable().optional(),
  professionalBodies: z.array(z.string()).nullable().optional(),
  graduateOutcomeUrl: z.string().url().or(z.literal('')).nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Course Structure sub-schema
// ---------------------------------------------------------------------------

export const CourseStructureSchema = z.object({
  creditPoints: z.number().nullable().optional(),
  numberOfUnits: z.number().nullable().optional(),
  coreCourses: z.array(z.string()).nullable().optional(),
  electiveCourses: z.array(z.string()).nullable().optional(),
  majors: z.array(z.string()).nullable().optional(),
  hasInternship: z.boolean().nullable().optional(),
  hasThesis: z.boolean().nullable().optional(),
  notes: z.string().nullable().optional(),
}).nullable().optional();

// ---------------------------------------------------------------------------
// Main AI Extraction Result — what the AI must return as JSON
// ---------------------------------------------------------------------------

export const ProgramExtractionResultSchema = z.object({
  programName: z.string().nullable().optional(),
  degreeLevel: z.enum([
    'Bachelor', 'Master', 'PhD', 'Diploma', 'Graduate Certificate',
    'Graduate Diploma', 'Associate Degree', 'Certificate', 'Other',
  ]).nullable().optional(),
  faculty: z.string().nullable().optional(),
  fieldOfStudy: z.string().nullable().optional(),
  discipline: z.string().nullable().optional(),
  cricosCode: z.string().nullable().optional(),
  programCode: z.string().nullable().optional(),
  campus: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  deliveryMode: z.enum(['on-campus', 'online', 'hybrid']).nullable().optional(),
  studyMode: z.enum(['full-time', 'part-time', 'both']).nullable().optional(),
  domesticAvailable: z.boolean().nullable().optional(),
  internationalAvailable: z.boolean().nullable().optional(),
  officialProgramUrl: z.string().url().or(z.literal('')).nullable().optional(),
  duration: z.string().nullable().optional(),
  estimatedCompletionTime: z.string().nullable().optional(),
  courseStructure: CourseStructureSchema,
  academicEntryRequirements: z.string().nullable().optional(),
  minimumGPA: z.string().nullable().optional(),
  prerequisiteSubjects: z.array(z.string()).nullable().optional(),
  englishRequirements: EnglishRequirementsSchema,
  portfolioRequired: z.boolean().nullable().optional(),
  workExperienceRequired: z.boolean().nullable().optional(),
  countrySpecificRequirements: z.string().nullable().optional(),
  tuition: TuitionSchema,
  scholarships: ScholarshipInfoSchema,
  intakes: IntakeSchema,
  careerOutcomes: CareerOutcomesSchema,
  aiSummary: z.string().nullable().optional(),
  warnings: z.array(
    z.union([
      ExtractionWarningSchema,
      z.string().transform(msg => ({ field: 'general', message: msg, severity: 'medium' as const }))
    ])
  ).nullable().optional(),
});
export type ProgramExtractionResult = z.infer<typeof ProgramExtractionResultSchema>;

// ---------------------------------------------------------------------------
// Normalized Program Record — final merged object going into StagedChange
// ---------------------------------------------------------------------------

export const ProgramNormalizedRecordSchema = ProgramExtractionResultSchema.extend({
  universityId: z.string(),
  universityName: z.string(),
  sourceUrls: z.array(z.string().url()).optional(),
  sourceEvidence: z.record(z.string(), FieldEvidenceSchema).optional(),
  confidenceScore: z.number().min(0).max(100),
  missingFields: z.array(z.string()).optional(),
  needsAdminReview: z.boolean().default(true),
  dataSourceType: SourceTypeEnum.optional(),
  extractedAt: z.string().datetime(),
  lastCheckedAt: z.string().datetime().optional(),
  rawExtractedText: z.string().optional(),
});
export type ProgramNormalizedRecord = z.infer<typeof ProgramNormalizedRecordSchema>;

// ---------------------------------------------------------------------------
// Program Discovery Result — URLs found for a university
// ---------------------------------------------------------------------------

export const ProgramDiscoveryResultSchema = z.object({
  universityId: z.string(),
  universityName: z.string(),
  officialWebsite: z.string().url(),
  discoveredUrls: z.array(z.object({
    url: z.string().url(),
    urlType: z.enum(['course_list', 'course_detail', 'fee', 'requirement', 'scholarship', 'sitemap', 'other']),
    priority: z.number().min(1).max(10),
  })),
  sitemapFound: z.boolean(),
  robotsTxtRespected: z.boolean(),
  discoveredAt: z.string().datetime(),
});
export type ProgramDiscoveryResult = z.infer<typeof ProgramDiscoveryResultSchema>;

// ---------------------------------------------------------------------------
// University Ingestion Job — BullMQ job data payload
// ---------------------------------------------------------------------------

export const UniversityIngestionJobSchema = z.object({
  universityId: z.string(),
  universityName: z.string(),
  officialWebsite: z.string().url(),
  triggeredBy: z.string().optional(),
  isRefresh: z.boolean().default(false),
  maxPages: z.number().min(1).max(500).default(50),
  ingestionJobId: z.string().optional(), // MongoDB IngestionJob _id
});
export type UniversityIngestionJob = z.infer<typeof UniversityIngestionJobSchema>;

// ---------------------------------------------------------------------------
// Confidence Score Calculation Input
// ---------------------------------------------------------------------------

export const ConfidenceInputSchema = z.object({
  hasOfficialSource: z.boolean(),
  hasCricosCode: z.boolean(),
  hasFeeData: z.boolean(),
  hasRequirementData: z.boolean(),
  hasCourseStructure: z.boolean(),
  hasIntakeData: z.boolean(),
  hasScholarshipData: z.boolean(),
  multipleSourcesAgree: z.boolean(),
  aiWarnings: z.number().min(0),
  fieldsExtracted: z.number().min(0),
  totalFields: z.number().min(1),
});
export type ConfidenceInput = z.infer<typeof ConfidenceInputSchema>;
