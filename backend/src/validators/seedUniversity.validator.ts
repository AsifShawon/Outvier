import { z } from 'zod';

/** Zod schema for a single row in the seed university CSV */
export const seedUniversityRowSchema = z.object({
  universityName: z.string().min(2, 'universityName is required'),
  country: z.string().default('Australia'),
  state: z.string().min(2, 'state is required'),
  city: z.string().optional().default(''),
  officialWebsite: z
    .string()
    .url('officialWebsite must be a valid URL')
    .or(z.string().length(0))
    .optional()
    .default(''),
  // Recommended but optional
  shortName: z.string().optional().default(''),
  campusName: z.string().optional().default(''),
  cricosProviderCode: z.string().optional().default(''),
  logoUrl: z.string().url('logoUrl must be a valid URL').or(z.string().length(0)).optional().default(''),
  providerType: z.string().optional().default(''),
  description: z.string().optional().default(''),
  notes: z.string().optional().default(''),
});

export type SeedUniversityRow = z.infer<typeof seedUniversityRowSchema>;

/** Validates a raw parsed CSV row and returns either the parsed value or an error message */
export function validateSeedRow(
  raw: Record<string, string>,
  rowIndex: number
): { valid: true; data: SeedUniversityRow } | { valid: false; errors: string[] } {
  const result = seedUniversityRowSchema.safeParse({
    universityName: raw.universityName || raw.university_name || '',
    country: raw.country || 'Australia',
    state: raw.state || '',
    city: raw.city || '',
    officialWebsite: raw.officialWebsite || raw.official_website || raw.website || '',
    shortName: raw.shortName || raw.short_name || '',
    campusName: raw.campusName || raw.campus_name || '',
    cricosProviderCode: raw.cricosProviderCode || raw.cricos_provider_code || raw.cricos || '',
    logoUrl: raw.logoUrl || raw.logo_url || raw.logo || '',
    providerType: raw.providerType || raw.provider_type || raw.type || '',
    description: raw.description || '',
    notes: raw.notes || '',
  });

  if (result.success) {
    return { valid: true, data: result.data };
  }

  const errors = result.error.errors.map((e) => `Row ${rowIndex}: [${e.path.join('.')}] ${e.message}`);
  return { valid: false, errors };
}
