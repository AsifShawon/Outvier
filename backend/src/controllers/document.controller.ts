import { Request, Response, NextFunction } from 'express';
import { DocumentRecord, IDocumentRecord } from '../models/Document.model';
import { Application } from '../models/Application.model';
import { documentSecurityService, MAX_DOCUMENT_SIZE_BYTES } from '../services/documentSecurity.service';
import { defaultStorageProvider } from '../services/storage/diskStorageProvider';
import { sendSuccess, sendError } from '../utils/response.util';
import { Types } from 'mongoose';

export const documentController = {
  /**
   * Uploads and encrypts a document.
   */
  async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      if (!user) {
        sendError(res, 401, 'UNAUTHORIZED', 'Authentication required');
        return;
      }

      const file = req.file;
      if (!file) {
        sendError(res, 400, 'NO_FILE', 'No file provided in multipart/form-data request');
        return;
      }

      const { documentType = 'other', title, applicationId } = req.body;

      // If applicationId is provided, verify application exists and user owns it or is admin
      let appRecord = null;
      if (applicationId) {
        appRecord = await Application.findById(applicationId);
        if (!appRecord) {
          sendError(res, 404, 'APPLICATION_NOT_FOUND', 'Application not found');
          return;
        }
        if (user.role !== 'admin' && appRecord.userId.toString() !== user.id) {
          sendError(res, 403, 'FORBIDDEN', 'Cannot attach document to another user\'s application');
          return;
        }
      }

      const doc = await documentSecurityService.processAndSaveDocument({
        userId: user.id,
        applicationId: applicationId || undefined,
        documentType,
        title: title || file.originalname,
        originalFilename: file.originalname,
        buffer: file.buffer,
        reportedMimeType: file.mimetype,
      });

      // Link document to application if provided
      if (appRecord) {
        if (!appRecord.documents.some((d) => d.toString() === doc._id.toString())) {
          appRecord.documents.push(doc._id as any);
          await appRecord.save();
        }
      }

      // Generate signed download token for immediate use
      const downloadToken = documentSecurityService.getSignedDownloadToken(
        doc._id.toString(),
        user.id,
        900
      );

      sendSuccess(
        res,
        {
          document: doc,
          downloadUrl: `/api/v1/documents/${doc._id}/download?token=${downloadToken}`,
        },
        undefined,
        undefined,
        201
      );
    } catch (error: any) {
      if (error.message?.includes('File size exceeds') || error.message?.includes('Unsupported file type') || error.message?.includes('magic bytes')) {
        sendError(res, 400, 'INVALID_FILE', error.message);
        return;
      }
      next(error);
    }
  },

  /**
   * Generates a signed, time-limited download URL for a document.
   */
  async getSignedDownloadUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 404, 'NOT_FOUND', 'Document not found');
        return;
      }

      if (!documentSecurityService.authorizeAccess(user, doc)) {
        sendError(res, 403, 'FORBIDDEN', 'You do not have permission to access this document');
        return;
      }

      const token = documentSecurityService.getSignedDownloadToken(doc._id.toString(), user.id, 900);
      const downloadUrl = `/api/v1/documents/${doc._id}/download?token=${token}`;

      sendSuccess(res, {
        documentId: doc._id,
        downloadUrl,
        expiresInSeconds: 900,
        filename: doc.originalFilename,
        mimeType: doc.mimeType,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Streams the decrypted document securely.
   */
  async downloadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { token } = req.query as { token?: string };
      const authUser = (req as any).user;

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      let isAuthorized = false;

      // 1. Verify via signed token
      if (token) {
        const verified = defaultStorageProvider.verifySignedDownloadToken(token);
        if (verified && verified.documentId === id) {
          // Token matches document ID
          isAuthorized = true;
        }
      }

      // 2. Fall back to active session auth
      if (!isAuthorized && authUser) {
        if (documentSecurityService.authorizeAccess(authUser, doc)) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        res.status(403).json({ success: false, message: 'Access denied or download link expired' });
        return;
      }

      if (doc.retentionState === 'deleted') {
        res.status(410).json({ success: false, message: 'Document has been permanently deleted' });
        return;
      }

      const fileBuffer = await defaultStorageProvider.readFile(
        doc.storageKey,
        doc.encryptionAlgorithm === 'AES-256-GCM'
      );

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(doc.originalFilename)}"`
      );
      res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

      res.send(fileBuffer);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets list of documents for current user or application.
   */
  async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { applicationId, documentType, retentionState = 'active' } = req.query as Record<string, string>;

      const query: any = {
        userId: user.role === 'admin' && !req.query.myOnly ? { $exists: true } : user.id,
      };

      if (retentionState !== 'all') {
        query.retentionState = retentionState;
      }
      if (applicationId) {
        query.applicationId = new Types.ObjectId(applicationId);
      }
      if (documentType) {
        query.documentType = documentType;
      }

      const documents = await DocumentRecord.find(query).sort({ createdAt: -1 });
      sendSuccess(res, documents);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Gets document metadata by ID.
   */
  async getDocumentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 404, 'NOT_FOUND', 'Document not found');
        return;
      }

      if (!documentSecurityService.authorizeAccess(user, doc)) {
        sendError(res, 403, 'FORBIDDEN', 'Access denied to this document');
        return;
      }

      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Updates document metadata or retention state.
   */
  async updateDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { title, documentType, retentionState } = req.body;

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 404, 'NOT_FOUND', 'Document not found');
        return;
      }

      if (!documentSecurityService.authorizeAccess(user, doc)) {
        sendError(res, 403, 'FORBIDDEN', 'Access denied');
        return;
      }

      if (title !== undefined) doc.title = title;
      if (documentType !== undefined) doc.documentType = documentType;
      if (retentionState !== undefined) doc.retentionState = retentionState;

      await doc.save();
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Deletes (soft or hard) a document.
   */
  async deleteDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { permanent } = req.query;

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 404, 'NOT_FOUND', 'Document not found');
        return;
      }

      if (!documentSecurityService.authorizeAccess(user, doc)) {
        sendError(res, 403, 'FORBIDDEN', 'Access denied');
        return;
      }

      if (permanent === 'true' || user.role === 'admin') {
        await defaultStorageProvider.deleteFile(doc.storageKey);
        await DocumentRecord.findByIdAndDelete(id);
        // Remove from applications referencing this document
        await Application.updateMany({ documents: id }, { $pull: { documents: id } });
        sendSuccess(res, { message: 'Document permanently deleted' });
      } else {
        doc.retentionState = 'deleted';
        await doc.save();
        sendSuccess(res, { message: 'Document moved to trash' });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * Staff/Admin document verification.
   */
  async verifyDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { verificationStatus, rejectionReason } = req.body;

      if (user.role !== 'admin') {
        sendError(res, 403, 'FORBIDDEN', 'Only staff/admin can verify documents');
        return;
      }

      const doc = await DocumentRecord.findById(id);
      if (!doc) {
        sendError(res, 404, 'NOT_FOUND', 'Document not found');
        return;
      }

      doc.verificationStatus = verificationStatus;
      doc.verifiedBy = new Types.ObjectId(user.id);
      doc.verifiedAt = new Date();
      if (rejectionReason) doc.rejectionReason = rejectionReason;

      await doc.save();
      sendSuccess(res, doc);
    } catch (error) {
      next(error);
    }
  },
};
