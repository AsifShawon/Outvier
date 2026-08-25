import { z } from 'zod';

export const documentTypeSchema = z.enum([
  'passport',
  'transcript',
  'degree_certificate',
  'english_test',
  'cv_resume',
  'sop',
  'lor',
  'financial_proof',
  'visa',
  'portfolio',
  'other',
]);

export const createPresignedUploadSchema = z.object({
  applicationId: z.string().optional(),
  documentType: documentTypeSchema,
  filename: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(100),
  fileSizeBytes: z.number().int().min(1).max(20 * 1024 * 1024),
  title: z.string().trim().max(200).optional(),
}).strict();

export const updateDocumentMetadataSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  documentType: documentTypeSchema.optional(),
  retentionState: z.enum(['active', 'archived', 'scheduled_deletion', 'deleted']).optional(),
}).strict();

export const verifyDocumentSchema = z.object({
  verificationStatus: z.enum(['staff_verified', 'rejected']),
  rejectionReason: z.string().trim().max(500).optional(),
}).strict();
