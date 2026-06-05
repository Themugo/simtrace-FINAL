import crypto from 'crypto';

// ── Secrets Management ─────────────────────────────────────────────────────────
// This module provides a secure way to handle secrets
// In production, integrate with AWS Secrets Manager, HashiCorp Vault, or Doppler

export interface SecretConfig {
  encryptionKey?: string;
  useEnvVars?: boolean;
}

class SecretsManager {
  private encryptionKey: string;
  private useEnvVars: boolean;

  constructor(config: SecretConfig = {}) {
    this.encryptionKey = config.encryptionKey || process.env.SECRET_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.useEnvVars = config.useEnvVars !== false;
  }

  // Encrypt a secret
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(this.encryptionKey, 'hex');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // Decrypt a secret
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const key = Buffer.from(this.encryptionKey, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Get a secret from environment or encrypted storage
  getSecret(key: string, encryptedValue?: string): string {
    if (this.useEnvVars) {
      const envValue = process.env[key];
      if (envValue) {
        return envValue;
      }
    }
    
    if (encryptedValue) {
      return this.decrypt(encryptedValue);
    }
    
    throw new Error(`Secret not found: ${key}`);
  }

  // Set a secret (encrypts and returns encrypted value)
  setSecret(plaintext: string): string {
    return this.encrypt(plaintext);
  }

  // Generate a random secret
  generateSecret(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash a secret (for passwords, API keys, etc.)
  hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  // Verify a secret against a hash
  verifySecret(secret: string, hash: string): boolean {
    const secretHash = this.hashSecret(secret);
    return secretHash === hash;
  }

  // Generate API key
  generateAPIKey(prefix = 'sk'): string {
    const randomPart = crypto.randomBytes(24).toString('hex');
    return `${prefix}_${randomPart}`;
  }

  // Validate API key format
  validateAPIKey(apiKey: string, prefix = 'sk'): boolean {
    const regex = new RegExp(`^${prefix}_[a-f0-9]{48}$`);
    return regex.test(apiKey);
  }
}

// Singleton instance
export const secretsManager = new SecretsManager();

// ── Common Secrets ─────────────────────────────────────────────────────────────
export const getDatabaseURL = (): string => {
  return secretsManager.getSecret('DATABASE_URL');
};

export const getRedisURL = (): string => {
  return secretsManager.getSecret('REDIS_URL');
};

export const getJWTSecret = (): string => {
  return secretsManager.getSecret('JWT_SECRET');
};

export const getStripeSecretKey = (): string => {
  return secretsManager.getSecret('STRIPE_SECRET_KEY');
};

export const getSendGridAPIKey = (): string => {
  return secretsManager.getSecret('SENDGRID_API_KEY');
};

export const getAWSSecretKey = (): string => {
  return secretsManager.getSecret('AWS_SECRET_KEY');
};

export const getAWSSecretAccessKey = (): string => {
  return secretsManager.getSecret('AWS_SECRET_ACCESS_KEY');
};
