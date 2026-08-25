import api from '../api';
import { ApiResponse } from '@/types/api';

export type DocumentType =
  | 'passport'
  | 'transcript'
  | 'degree_certificate'
  | 'english_test'
  | 'cv_resume'
  | 'sop'
  | 'lor'
  | 'financial_proof'
  | 'visa'
  | 'portfolio'
  | 'other';

export type ScanStatus = 'pending' | 'clean' | 'quarantined' | 'infected';
export type RetentionState = 'active' | 'archived' | 'scheduled_deletion' | 'deleted';
export type VerificationStatus = 'unverified' | 'staff_verified' | 'rejected';

export interface DocumentRecord {
  _id: string;
  userId: string;
  applicationId?: string;
  documentType: DocumentType;
  title: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  checksumSha256: string;
  scanStatus: ScanStatus;
  scanDetails?: string;
  encryptionAlgorithm: 'AES-256-GCM' | 'NONE';
  retentionState: RetentionState;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SignedDownloadResponse {
  documentId: string;
  downloadUrl: string;
  expiresInSeconds: number;
  filename: string;
  mimeType: string;
}

export interface UploadDocumentResponse {
  document: DocumentRecord;
  downloadUrl: string;
}

export const documentsApi = {
  getDocuments: (params?: { applicationId?: string; documentType?: string; retentionState?: string }) =>
    api.get<ApiResponse<DocumentRecord[]>>('/documents', { params }),

  getDocumentById: (id: string) =>
    api.get<ApiResponse<DocumentRecord>>(`/documents/${id}`),

  getSignedDownloadUrl: (id: string) =>
    api.get<ApiResponse<SignedDownloadResponse>>(`/documents/${id}/signed-url`),

  uploadDocument: (formData: FormData) =>
    api.post<ApiResponse<UploadDocumentResponse>>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateMetadata: (id: string, data: { title?: string; documentType?: DocumentType; retentionState?: RetentionState }) =>
    api.patch<ApiResponse<DocumentRecord>>(`/documents/${id}`, data),

  deleteDocument: (id: string, permanent: boolean = false) =>
    api.delete<ApiResponse<{ message: string }>>(`/documents/${id}`, {
      params: { permanent: permanent ? 'true' : 'false' },
    }),

  verifyDocument: (id: string, data: { verificationStatus: 'staff_verified' | 'rejected'; rejectionReason?: string }) =>
    api.patch<ApiResponse<DocumentRecord>>(`/documents/${id}/verify`, data),
};
