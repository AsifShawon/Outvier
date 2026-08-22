import { z } from 'zod';

export const standardPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  cursor: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  sortField: z.string().trim().max(50).optional(),
  sortDirection: z.enum(['asc', 'desc']).default('asc').optional(),
});

export type StandardPaginationQuery = z.infer<typeof standardPaginationQuerySchema>;
