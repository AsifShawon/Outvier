import { z } from 'zod';

export const documentChecklistItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Document name is required').max(200),
  status: z.enum(['pending', 'preparing', 'uploaded', 'submitted', 'verified', 'completed', 'not_required']).default('pending'),
  fileUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional(),
});

export const trackerTaskItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1, 'Task title is required').max(200),
  completed: z.boolean().default(false),
  dueDate: z.coerce.date().optional(),
  category: z.string().optional(),
  order: z.number().int().optional(),
});

export const createTrackerItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(300),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  itemType: z.enum(['program', 'university', 'scholarship', 'visa', 'custom']).default('program'),
  programId: z.string().optional(),
  universityId: z.string().optional(),
  columnId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  deadline: z.coerce.date().optional(),
  intake: z.string().trim().max(100).optional(),
  applicationUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().max(50)).default([]),
  customProgramName: z.string().trim().max(200).optional(),
  customUniversityName: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  documentChecklist: z.array(documentChecklistItemSchema).optional(),
  tasks: z.array(trackerTaskItemSchema).optional(),
}).strict(); // Disallow server-managed fields like userId, boardId, history!

export const updateTrackerItemSchema = z.object({
  title: z.string().trim().min(1).max(300).optional(),
  subtitle: z.string().trim().max(300).optional(),
  description: z.string().trim().max(3000).optional(),
  columnId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  deadline: z.coerce.date().optional().nullable(),
  intake: z.string().trim().max(100).optional(),
  applicationUrl: z.string().url().optional().or(z.literal('')).nullable(),
  notes: z.string().trim().max(5000).optional(),
  tags: z.array(z.string().trim().max(50)).optional(),
  customProgramName: z.string().trim().max(200).optional(),
  customUniversityName: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  documentChecklist: z.array(documentChecklistItemSchema).optional(),
  tasks: z.array(trackerTaskItemSchema).optional(),
  order: z.number().int().optional(),
  archived: z.boolean().optional(),
}).strict();

export const moveTrackerItemSchema = z.object({
  toColumnId: z.string().min(1, 'toColumnId is required'),
  order: z.number().int().optional(),
}).strict();

export const createColumnSchema = z.object({
  title: z.string().trim().min(1, 'Column title is required').max(100),
  description: z.string().trim().max(300).optional(),
  color: z.string().trim().max(30).optional(),
  wipLimit: z.number().int().min(1).optional(),
}).strict();

export const updateColumnSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(300).optional(),
  color: z.string().trim().max(30).optional(),
  isArchived: z.boolean().optional(),
  wipLimit: z.number().int().min(1).optional().nullable(),
}).strict();

export const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number().int(),
    })
  ).min(1, 'Columns array must not be empty'),
}).strict();

export const updateBoardSchema = z.object({
  name: z.string().trim().min(1).max(150).optional(),
  settings: z.record(z.unknown()).optional(),
}).strict();

export const trackerQuerySchema = z.object({
  archived: z.enum(['true', 'false']).optional(),
  columnId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  itemType: z.enum(['program', 'university', 'scholarship', 'visa', 'custom']).optional(),
  country: z.string().trim().optional(),
  search: z.string().trim().max(200).optional(),
  cursor: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  sortField: z.string().trim().default('order').optional(),
  sortDirection: z.enum(['asc', 'desc']).default('asc').optional(),
});

export type CreateTrackerItemDTO = z.infer<typeof createTrackerItemSchema>;
export type UpdateTrackerItemDTO = z.infer<typeof updateTrackerItemSchema>;
export type TrackerQueryDTO = z.infer<typeof trackerQuerySchema>;
