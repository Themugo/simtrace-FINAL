// services/encryption.ts - Data encryption at rest service
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypt data using AES-256
 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt data using AES-256
 */
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

/**
 * Encrypt object fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj };
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      encrypted[field] = encrypt(encrypted[field]) as T[typeof field];
    }
  }
  return encrypted;
}

/**
 * Decrypt object fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj };
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      try {
        decrypted[field] = decrypt(decrypted[field]) as T[typeof field];
      } catch (error) {
        // If decryption fails, keep original value (might not be encrypted)
        console.warn(`Failed to decrypt field ${String(field)}:`, error);
      }
    }
  }
  return decrypted;
}

/**
 * Hash sensitive data for comparison (one-way)
 */
export function hashData(data: string): string {
  return CryptoJS.SHA256(data).toString();
}

/**
 * Verify hashed data
 */
export function verifyHash(data: string, hash: string): boolean {
  return hashData(data) === hash;
}
