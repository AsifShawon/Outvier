import { z } from 'zod';

export const listStagedChangesQuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'all']).default('pending').optional(),
  entityType: z.enum(['university', 'program', 'program_location', 'scholarship', 'ranking', 'all']).optional(),
  source: z.string().optional(),
  universityId: z.string().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50).optional(),
  sortField: z.string().default('createdAt').optional(),
  sortDirection: z.enum(['asc', 'desc']).default('desc').optional(),
});

export const bulkApproveRejectSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'ids array must contain at least 1 item'),
  notes: z.string().trim().max(1000).optional(),
});

export const rejectStagedChangeSchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

export const editAndApproveSchema = z.object({
  proposedData: z.record(z.unknown()),
  notes: z.string().trim().max(1000).optional(),
});
