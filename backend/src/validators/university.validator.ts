import { z } from 'zod';

export const createUniversitySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  location: z.string().min(2, 'Location is required'),
  state: z.string().min(2, 'State is required'),
  website: z.string().url('Website must be a valid URL'),
  logo: z.string().url().optional().or(z.literal('')),
  establishedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  ranking: z.number().int().min(1).optional(),
  type: z.enum(['public', 'private']),
  campuses: z.array(z.string()).optional(),
  internationalStudents: z.boolean().optional(),
});

export const updateUniversitySchema = createUniversitySchema.partial();

export type CreateUniversityDTO = z.infer<typeof createUniversitySchema>;
export type UpdateUniversityDTO = z.infer<typeof updateUniversitySchema>;
