export interface SaveFileResult {
  storageKey: string;
  checksumSha256: string;
  fileSizeBytes: number;
}

export interface IStorageProvider {
  /**
   * Encrypts and writes a file buffer to storage.
   */
  saveFile(
    userId: string,
    filename: string,
    buffer: Buffer,
    mimeType: string,
    encrypt?: boolean
  ): Promise<SaveFileResult>;

  /**
   * Reads and decrypts a file buffer from storage.
   */
  readFile(storageKey: string, encrypted?: boolean): Promise<Buffer>;

  /**
   * Deletes a file from storage.
   */
  deleteFile(storageKey: string): Promise<void>;

  /**
   * Generates a signed, time-limited token for secure downloads.
   */
  generateSignedDownloadToken(
    documentId: string,
    userId: string,
    expiresInSeconds?: number
  ): string;

  /**
   * Verifies a signed download token.
   */
  verifySignedDownloadToken(
    token: string
  ): { documentId: string; userId: string } | null;
}
