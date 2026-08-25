import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { IStorageProvider, SaveFileResult } from './storageProvider.interface';
import { env } from '../../config/env';

export class DiskStorageProvider implements IStorageProvider {
  private baseDir: string;
  private encryptionKey: Buffer;
  private tokenSecret: string;

  constructor() {
    this.baseDir = process.env.STORAGE_DIR
      ? path.resolve(process.env.STORAGE_DIR)
      : path.resolve(process.cwd(), 'uploads', 'secure_documents');

    const rawKey = process.env.DOCUMENT_ENCRYPTION_KEY || env.JWT_SECRET || 'outvier-secret-default-key-32b-long!!';
    this.encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
    this.tokenSecret = env.JWT_SECRET || 'outvier-jwt-secret-fallback';
  }

  private async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch {
      // already exists
    }
  }

  async saveFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
    encrypt: boolean = true
  ): Promise<SaveFileResult> {
    const userDir = path.join(this.baseDir, userId);
    await this.ensureDir(userDir);

    const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(filename) || '.bin';
    const uniqueName = `${crypto.randomUUID()}${ext}${encrypt ? '.enc' : ''}`;
    const relativeKey = path.join(userId, uniqueName).replace(/\\/g, '/');
    const fullPath = path.join(this.baseDir, relativeKey);

    let dataToWrite = buffer;

    if (encrypt) {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
      const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Structure: [12 bytes IV] + [16 bytes Auth Tag] + [Encrypted Data]
      dataToWrite = Buffer.concat([iv, authTag, encrypted]);
    }

    await fs.writeFile(fullPath, dataToWrite);

    return {
      storageKey: relativeKey,
      checksumSha256,
      fileSizeBytes: buffer.length,
    };
  }

  async readFile(storageKey: string, encrypted: boolean = true): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, storageKey);
    const rawData = await fs.readFile(fullPath);

    if (!encrypted || !storageKey.endsWith('.enc')) {
      return rawData;
    }

    // Structure: [12 bytes IV] + [16 bytes Auth Tag] + [Encrypted Data]
    if (rawData.length < 28) {
      throw new Error('Corrupted or invalid encrypted document');
    }

    const iv = rawData.subarray(0, 12);
    const authTag = rawData.subarray(12, 28);
    const encryptedBytes = rawData.subarray(28);

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(encryptedBytes), decipher.final()]);
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      const fullPath = path.join(this.baseDir, storageKey);
      await fs.unlink(fullPath);
    } catch {
      // Ignore if already deleted
    }
  }

  generateSignedDownloadToken(
    documentId: string,
    userId: string,
    expiresInSeconds: number = 900 // 15 minutes default
  ): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${documentId}:${userId}:${expiresAt}`;
    const signature = crypto
      .createHmac('sha256', this.tokenSecret)
      .update(payload)
      .digest('hex');
    const token = Buffer.from(`${payload}:${signature}`).toString('base64url');
    return token;
  }

  verifySignedDownloadToken(token: string): { documentId: string; userId: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf8');
      const parts = decoded.split(':');
      if (parts.length !== 4) return null;

      const [documentId, userId, expiresAtStr, receivedSig] = parts;
      const expiresAt = parseInt(expiresAtStr, 10);

      if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) {
        return null; // Expired
      }

      const payload = `${documentId}:${userId}:${expiresAtStr}`;
      const expectedSig = crypto
        .createHmac('sha256', this.tokenSecret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig))) {
        return null;
      }

      return { documentId, userId };
    } catch {
      return null;
    }
  }
}

export const defaultStorageProvider = new DiskStorageProvider();
