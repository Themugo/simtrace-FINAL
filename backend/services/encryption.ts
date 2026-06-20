// services/encryption.ts - Data encryption at rest service
import CryptoJS from 'crypto-js';

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY is not set. This module refuses to fall back to a " +
      "default key — a hardcoded fallback would be visible to anyone who can " +
      "read this source file, making any 'encrypted' data trivially " +
      "decryptable. Set ENCRYPTION_KEY to a strong random value before using " +
      "this module."
    );
  }
  return key;
}

/**
 * Encrypt data using AES-256
 */
export function encrypt(data: string): string {
  return CryptoJS.AES.encrypt(data, getEncryptionKey()).toString();
}

/**
 * Decrypt data using AES-256
 */
export function decrypt(encryptedData: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedData, getEncryptionKey());
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
