import { z } from 'zod';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A string field that, when non-empty, is coerced to a number.
 * The form stores the raw string; Zod's output type is `number | undefined`.
 */
const optionalNumericString = z
  .string()
  .optional()
  .transform((v) => (v && v.trim() !== '' ? Number(v) : undefined))
  .pipe(z.number().int().positive().optional());

/**
 * A CSV string that transforms to a trimmed, non-empty string[].
 * The form stores the raw CSV string; output is `string[]`.
 */
const csvToArray = z
  .string()
  .optional()
  .transform((v) =>
    v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []
  );

// ---------------------------------------------------------------------------
// Section schemas (for reuse in partial validation)
// ---------------------------------------------------------------------------

export const universityIdentitySchema = z.object({
  /** Full official name */
  name: z.string().min(2, 'Name must be at least 2 characters'),
  /** Short name / abbreviation */
  shortName: z.string().optional(),
  /** Summary description */
  description: z.string().min(10, 'Description must be at least 10 characters'),
  /** Public or Private */
  type: z.enum(['public', 'private']).default('public'),
  /** Year founded — stored as string in form, output as number */
  establishedYear: optionalNumericString,
});

export const universityRegistrationSchema = z.object({
  /** CRICOS provider code e.g. 00123M */
  cricosProviderCode: z.string().optional(),
  /** Broad institution type e.g. "university", "TAFE" */
  institutionType: z.string().optional(),
  /** Provider type from CRICOS dataset */
  providerType: z.string().optional(),
  /** Max student capacity */
  institutionCapacity: optionalNumericString,
});

export const universityWebsitesSchema = z.object({
  /** Main public website */
  website: z
    .string()
    .url('Must be a valid URL (e.g. https://www.university.edu.au)')
    .or(z.literal(''))
    .optional(),
  /** Official website (may differ from public site) */
  officialWebsite: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
  /** URL to logo image */
  logo: z
    .string()
    .url('Must be a valid URL')
    .or(z.literal(''))
    .optional(),
});

export const universityLocationsSchema = z.object({
  /** Primary city */
  city: z.string().optional(),
  /** State/territory abbreviation */
  state: z.string().min(2, 'State is required'),
  /** Country name */
  country: z.string().optional().default('Australia'),
  /** Location description (legacy field) */
  location: z.string().optional(),
  /** Comma-separated campus names — output as string[] */
  campuses: csvToArray,
  /** Whether international students are accepted */
  internationalStudents: z.boolean().optional().default(false),
});

export const universitySourceSchema = z.object({
  /** Source dataset name */
  sourceName: z.string().optional(),
  /** Overall ranking number */
  ranking: optionalNumericString,
  /** Ranking band descriptor e.g. "Top 100" */
  rankingBand: z.string().optional(),
});

export const universityPublicationSchema = z.object({
  /** Publication status */
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  /** Trigger AI program discovery after save (create only) */
  autoDiscoverPrograms: z.boolean().optional().default(true),
});

// ---------------------------------------------------------------------------
// Full schema — composed from section schemas
// ---------------------------------------------------------------------------

export const universityFormSchema = universityIdentitySchema
  .merge(universityRegistrationSchema)
  .merge(universityWebsitesSchema)
  .merge(universityLocationsSchema)
  .merge(universitySourceSchema)
  .merge(universityPublicationSchema);

// ---------------------------------------------------------------------------
// Derived TypeScript types
// ---------------------------------------------------------------------------

/** The shape RHF works with (all fields as strings/booleans). */
export type UniversityFormInput = z.input<typeof universityFormSchema>;

/** The validated + transformed shape passed to the API. */
export type UniversityFormOutput = z.output<typeof universityFormSchema>;

// ---------------------------------------------------------------------------
// Default values matching UniversityFormInput
// ---------------------------------------------------------------------------

export const universityFormDefaults: UniversityFormInput = {
  name: '',
  shortName: '',
  description: '',
  type: 'public',
  establishedYear: '',
  cricosProviderCode: '',
  institutionType: '',
  providerType: '',
  institutionCapacity: '',
  website: '',
  officialWebsite: '',
  logo: '',
  city: '',
  state: '',
  country: 'Australia',
  location: '',
  campuses: '',
  internationalStudents: false,
  sourceName: '',
  ranking: '',
  rankingBand: '',
  status: 'draft',
  autoDiscoverPrograms: true,
};
