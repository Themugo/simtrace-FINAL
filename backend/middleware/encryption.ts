// middleware/encryption.ts - Encryption middleware for sensitive fields
import { Request, Response, NextFunction } from 'express';
import { encrypt, decrypt, encryptObject, decryptObject } from '../services/encryption.js';

/**
 * Encrypt sensitive fields in request body before saving
 */
export function encryptRequestBody(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      try {
        req.body = encryptObject(req.body, fields as any);
      } catch (error) {
        console.error('Encryption error:', error);
      }
    }
    next();
  };
}

/**
 * Decrypt sensitive fields in response before sending
 */
export function decryptResponse(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (data && typeof data === 'object') {
        try {
          data = decryptObject(data, fields as any);
        } catch (error: unknown) {
          console.error('Decryption error:', error);
        }
      }
      return originalJson(data);
    };
    next();
  };
}

/**
 * Encrypt specific field in request
 */
export function encryptField(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && req.body[fieldName]) {
      try {
        req.body[fieldName] = encrypt(req.body[fieldName]);
      } catch (error) {
        console.error(`Error encrypting field ${fieldName}:`, error);
      }
    }
    next();
  };
}

/**
 * Decrypt specific field in response
 */
export function decryptField(fieldName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (data && typeof data === 'object' && data !== null && fieldName in data) {
        try {
          (data as Record<string, unknown>)[fieldName] = decrypt((data as Record<string, unknown>)[fieldName] as string);
        } catch (error: unknown) {
          console.error(`Error decrypting field ${fieldName}:`, error);
        }
      }
      return originalJson(data);
    };
    next();
  };
}
