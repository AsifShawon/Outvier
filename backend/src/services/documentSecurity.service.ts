import { IDocumentRecord, DocumentRecord, DocumentType, ScanStatus } from '../models/Document.model';
import { IStorageProvider } from './storage/storageProvider.interface';
import { defaultStorageProvider } from './storage/diskStorageProvider';
import { Types } from 'mongoose';

export const MAX_DOCUMENT_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_MIME_TYPES: Record<string, { ext: string[]; magicBytes: number[][] }> = {
  'application/pdf': {
    ext: ['.pdf'],
    magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  },
  'image/jpeg': {
    ext: ['.jpg', '.jpeg'],
    magicBytes: [[0xff, 0xd8, 0xff]], // JPEG header
  },
  'image/png': {
    ext: ['.png'],
    magicBytes: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG header
  },
  'image/webp': {
    ext: ['.webp'],
    magicBytes: [[0x52, 0x49, 0x46, 0x46]], // RIFF header
  },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
    ext: ['.docx'],
    magicBytes: [[0x50, 0x4b, 0x03, 0x04]], // ZIP/DOCX header
  },
};

export interface ValidateDocumentOptions {
  buffer: Buffer;
  reportedMimeType: string;
  filename: string;
  maxSizeBytes?: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedMimeType?: string;
}

export class DocumentSecurityService {
  private storage: IStorageProvider;

  constructor(storage: IStorageProvider = defaultStorageProvider) {
    this.storage = storage;
  }

  /**
   * Validates file size, MIME type whitelist, and magic byte headers.
   */
  validateFile({
    buffer,
    reportedMimeType,
    filename,
    maxSizeBytes = MAX_DOCUMENT_SIZE_BYTES,
  }: ValidateDocumentOptions): ValidationResult {
    // 1. File size check
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Uploaded file is empty' };
    }

    if (buffer.length > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds the ${maxSizeBytes / (1024 * 1024)}MB limit`,
      };
    }

    // 2. MIME Whitelist
    const mimeConfig = ALLOWED_MIME_TYPES[reportedMimeType.toLowerCase()];
    if (!mimeConfig) {
      return {
        valid: false,
        error: `Unsupported file type: ${reportedMimeType}. Allowed types: PDF, JPEG, PNG, WEBP, DOCX`,
      };
    }

    // 3. Extension check
    const lowerFilename = filename.toLowerCase();
    const hasValidExt = mimeConfig.ext.some((ext) => lowerFilename.endsWith(ext));
    if (!hasValidExt) {
      return {
        valid: false,
        error: `Filename extension does not match expected format for ${reportedMimeType}`,
      };
    }

    // 4. Magic Bytes Inspection
    const matchesMagic = mimeConfig.magicBytes.some((magic) => {
      if (buffer.length < magic.length) return false;
      for (let i = 0; i < magic.length; i++) {
        if (buffer[i] !== magic[i]) return false;
      }
      return true;
    });

    if (!matchesMagic) {
      return {
        valid: false,
        error: 'File content does not match its reported file signature (magic bytes mismatch)',
      };
    }

    return { valid: true, detectedMimeType: reportedMimeType };
  }

  /**
   * Performs virus / malware scanning check.
   */
  scanForMalware(buffer: Buffer, filename: string): { status: ScanStatus; details?: string } {
    // Check for EICAR standard antivirus test string or suspicious PE executable headers
    const eicarSignature = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const bufferStr = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf8');

    if (bufferStr.includes(eicarSignature)) {
      return { status: 'infected', details: 'Detected EICAR test signature' };
    }

    // Check for Windows PE executable header (MZ) disguised as document
    if (buffer.length > 2 && buffer[0] === 0x4d && buffer[1] === 0x5a && !filename.endsWith('.docx')) {
      return { status: 'quarantined', details: 'Detected executable PE binary signature' };
    }

    return { status: 'clean' };
  }

  /**
   * Multi-tenant Owner Authorization Check.
   * Returns true if user is owner of the document OR admin.
   */
  authorizeAccess(user: { id: string; role: string }, document: IDocumentRecord): boolean {
    if (user.role === 'admin') {
      return true;
    }
    return document.userId.toString() === user.id.toString();
  }

  /**
   * Securely saves an uploaded document to storage and creates Mongo metadata.
   */
  async processAndSaveDocument({
    userId,
    applicationId,
    documentType,
    title,
    originalFilename,
    buffer,
    reportedMimeType,
  }: {
    userId: string;
    applicationId?: string;
    documentType: DocumentType;
    title: string;
    originalFilename: string;
    buffer: Buffer;
    reportedMimeType: string;
  }): Promise<IDocumentRecord> {
    // 1. Validation
    const validation = this.validateFile({
      buffer,
      reportedMimeType,
      filename: originalFilename,
    });
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file');
    }

    // 2. Malware scan
    const scanResult = this.scanForMalware(buffer, originalFilename);
    if (scanResult.status === 'infected' || scanResult.status === 'quarantined') {
      throw new Error(`File rejected: Malware scan flagged as ${scanResult.status} (${scanResult.details})`);
    }

    // 3. Encrypt and save to storage provider
    const saveResult = await this.storage.saveFile(
      userId,
      originalFilename,
      buffer,
      reportedMimeType,
      true
    );

    // 4. Save metadata record in MongoDB (strictly NO binary in Mongo)
    const doc = await DocumentRecord.create({
      userId: new Types.ObjectId(userId),
      ...(applicationId && { applicationId: new Types.ObjectId(applicationId) }),
      documentType,
      title: title || originalFilename,
      originalFilename,
      storageKey: saveResult.storageKey,
      mimeType: reportedMimeType,
      fileSizeBytes: saveResult.fileSizeBytes,
      checksumSha256: saveResult.checksumSha256,
      scanStatus: scanResult.status,
      scanDetails: scanResult.details,
      encryptionAlgorithm: 'AES-256-GCM',
      retentionState: 'active',
      verificationStatus: 'unverified',
    });

    return doc;
  }

  /**
   * Generates a signed, time-limited download URL / token for an authorized user.
   */
  getSignedDownloadToken(documentId: string, userId: string, expiresInSeconds = 900): string {
    return this.storage.generateSignedDownloadToken(documentId, userId, expiresInSeconds);
  }

  /**
   * Retrieves and decrypts the document buffer after verifying permissions.
   */
  async retrieveDocumentContent(
    document: IDocumentRecord,
    user: { id: string; role: string }
  ): Promise<Buffer> {
    if (!this.authorizeAccess(user, document)) {
      throw new Error('UNAUTHORIZED_ACCESS');
    }

    if (document.retentionState === 'deleted') {
      throw new Error('DOCUMENT_DELETED');
    }

    return this.storage.readFile(
      document.storageKey,
      document.encryptionAlgorithm === 'AES-256-GCM'
    );
  }
}

export const documentSecurityService = new DocumentSecurityService();
