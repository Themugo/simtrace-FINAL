import crypto from "crypto";

export interface StorageUploadResult {
  storagePath: string;
  fileSize: number;
  mimeType: string;
  hash: string;
  url: string;
}

export class StorageService {
  /**
   * Computes SHA-256 hash of a buffer or string to ensure file integrity.
   */
  public static generateHash(data: Buffer | string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Uploads file to mock/simulated S3 or local secure storage with hash computation.
   */
  public static async uploadFile(
    fileName: string,
    fileBuffer: Buffer,
    mimeType: string,
    organizationId: string
  ): Promise<StorageUploadResult> {
    const hash = this.generateHash(fileBuffer);
    const timePrefix = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const storagePath = `orgs/${organizationId}/documents/${timePrefix}_${sanitizedName}`;

    return {
      storagePath,
      fileSize: fileBuffer.length,
      mimeType,
      hash,
      url: `/api/documents/download?path=${encodeURIComponent(storagePath)}&hash=${hash}`,
    };
  }

  /**
   * Generates a secure temporary signed URL for file access.
   */
  public static generateSecureUrl(storagePath: string, expiresInSeconds: number = 900): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const token = crypto.createHash("sha256").update(`${storagePath}:${expiresAt}:simtrace_secret_key`).digest("hex");
    return `/api/documents/secure-file?path=${encodeURIComponent(storagePath)}&expires=${expiresAt}&signature=${token}`;
  }

  /**
   * Verifies file integrity against expected SHA-256 hash.
   */
  public static verifyFileHash(fileBuffer: Buffer, expectedHash: string): boolean {
    const computed = this.generateHash(fileBuffer);
    return computed === expectedHash;
  }
}
