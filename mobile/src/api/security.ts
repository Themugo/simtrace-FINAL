// mobile/src/api/security.ts - Advanced security API client for mobile app
const API_BASE_URL = 'https://simtrace-backend.onrender.com';

export interface ZKProof {
  proof: string;
  publicInputs: any[];
  verificationKey: string;
}

export interface ZKVerificationResult {
  isValid: boolean;
  confidence: number;
  timestamp: number;
}

export interface EncryptionResult {
  ciphertext: string;
  nonce: string;
  keyId: string;
  algorithm: string;
}

export interface DecryptionResult {
  plaintext: string;
  success: boolean;
  algorithm: string;
}

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  algorithm: string;
  createdAt: number;
}

export interface SecureEnclaveKey {
  keyId: string;
  keyData: string;
  keyType: 'symmetric' | 'asymmetric';
  createdAt: number;
  expiresAt: number;
  accessLevel: 'user' | 'admin' | 'system';
}

export interface SecureData {
  dataId: string;
  encryptedData: string;
  keyId: string;
  metadata: {
    encryptedAt: number;
    accessCount: number;
    lastAccessed: number;
  };
}

export interface EvidenceBlock {
  blockNumber: number;
  timestamp: number;
  evidenceHash: string;
  previousHash: string;
  data: any;
  signature: string;
  validator: string;
}

export interface BiometricMatchResult {
  isMatch: boolean;
  confidence: number;
  biometricType: string;
  timestamp: number;
  details: {
    similarityScore: number;
    livenessScore: number;
    qualityScore: number;
  };
}

export interface BiometricEnrollmentResult {
  success: boolean;
  templateId: string;
  quality: number;
  message: string;
}

class SecurityApi {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/security`;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // ── Zero-Knowledge Proofs ─────────────────────────────────────────────────────

  async generateOwnershipProof(deviceId: string, userId: string): Promise<{ proof: ZKProof }> {
    return this.request('/zk/ownership-proof', {
      method: 'POST',
      body: JSON.stringify({ deviceId, userId }),
    });
  }

  async verifyProof(proof: ZKProof, deviceId: string): Promise<{ result: ZKVerificationResult }> {
    return this.request('/zk/verify-proof', {
      method: 'POST',
      body: JSON.stringify({ proof, deviceId }),
    });
  }

  // ── Quantum-Resistant Encryption ───────────────────────────────────────────────

  async generateKeyPair(algorithm?: string): Promise<{ keyPair: KeyPair }> {
    return this.request('/quantum/generate-keypair', {
      method: 'POST',
      body: JSON.stringify({ algorithm }),
    });
  }

  async encrypt(plaintext: string, publicKey: string, algorithm?: string): Promise<{ result: EncryptionResult }> {
    return this.request('/quantum/encrypt', {
      method: 'POST',
      body: JSON.stringify({ plaintext, publicKey, algorithm }),
    });
  }

  async decrypt(encryptedData: EncryptionResult, privateKey: string): Promise<{ result: DecryptionResult }> {
    return this.request('/quantum/decrypt', {
      method: 'POST',
      body: JSON.stringify({ encryptedData, privateKey }),
    });
  }

  // ── Secure Enclave ─────────────────────────────────────────────────────────────

  async generateSecureKey(
    keyType?: 'symmetric' | 'asymmetric',
    accessLevel?: 'user' | 'admin' | 'system',
    ttl?: number
  ): Promise<{ key: SecureEnclaveKey }> {
    return this.request('/enclave/generate-key', {
      method: 'POST',
      body: JSON.stringify({ keyType, accessLevel, ttl }),
    });
  }

  async encryptData(
    plaintext: string,
    keyId: string,
    accessLevel?: 'user' | 'admin' | 'system'
  ): Promise<{ result: SecureData }> {
    return this.request('/enclave/encrypt', {
      method: 'POST',
      body: JSON.stringify({ plaintext, keyId, accessLevel }),
    });
  }

  async decryptData(
    dataId: string,
    accessLevel?: 'user' | 'admin' | 'system'
  ): Promise<{ plaintext: string }> {
    return this.request('/enclave/decrypt', {
      method: 'POST',
      body: JSON.stringify({ dataId, accessLevel }),
    });
  }

  async getAttestation(): Promise<{ attestation: any }> {
    return this.request('/enclave/attestation');
  }

  // ── Blockchain Evidence Chain ───────────────────────────────────────────────────

  async addEvidence(evidenceData: any): Promise<{ result: any }> {
    return this.request('/blockchain/add-evidence', {
      method: 'POST',
      body: JSON.stringify(evidenceData),
    });
  }

  async getEvidence(blockNumber: number): Promise<{ evidence: any }> {
    return this.request(`/blockchain/evidence/${blockNumber}`);
  }

  async getDeviceEvidence(deviceId: string): Promise<{ evidence: EvidenceBlock[] }> {
    return this.request(`/blockchain/device/${deviceId}`);
  }

  async verifyChain(): Promise<{ isValid: boolean; chainLength: number }> {
    return this.request('/blockchain/verify');
  }

  async getBlockchainStatistics(): Promise<{ stats: any }> {
    return this.request('/blockchain/statistics');
  }

  // ── Multi-Factor Biometrics ────────────────────────────────────────────────────

  async enrollFace(userId: string, faceData: string, qualityThreshold?: number): Promise<{ result: BiometricEnrollmentResult }> {
    return this.request('/biometrics/enroll-face', {
      method: 'POST',
      body: JSON.stringify({ userId, faceData, qualityThreshold }),
    });
  }

  async enrollVoice(userId: string, voiceData: string, qualityThreshold?: number): Promise<{ result: BiometricEnrollmentResult }> {
    return this.request('/biometrics/enroll-voice', {
      method: 'POST',
      body: JSON.stringify({ userId, voiceData, qualityThreshold }),
    });
  }

  async enrollFingerprint(userId: string, fingerprintData: string, qualityThreshold?: number): Promise<{ result: BiometricEnrollmentResult }> {
    return this.request('/biometrics/enroll-fingerprint', {
      method: 'POST',
      body: JSON.stringify({ userId, fingerprintData, qualityThreshold }),
    });
  }

  async authenticateFace(userId: string, faceData: string, threshold?: number): Promise<{ result: BiometricMatchResult }> {
    return this.request('/biometrics/authenticate-face', {
      method: 'POST',
      body: JSON.stringify({ userId, faceData, threshold }),
    });
  }

  async authenticateVoice(userId: string, voiceData: string, threshold?: number): Promise<{ result: BiometricMatchResult }> {
    return this.request('/biometrics/authenticate-voice', {
      method: 'POST',
      body: JSON.stringify({ userId, voiceData, threshold }),
    });
  }

  async authenticateFingerprint(userId: string, fingerprintData: string, threshold?: number): Promise<{ result: BiometricMatchResult }> {
    return this.request('/biometrics/authenticate-fingerprint', {
      method: 'POST',
      body: JSON.stringify({ userId, fingerprintData, threshold }),
    });
  }

  async multiFactorAuthenticate(
    userId: string,
    biometricData: { face?: string; voice?: string; fingerprint?: string },
    requiredFactors?: number,
    threshold?: number
  ): Promise<{ result: any }> {
    return this.request('/biometrics/multi-factor', {
      method: 'POST',
      body: JSON.stringify({ userId, biometricData, requiredFactors, threshold }),
    });
  }

  // ── Security Audit ─────────────────────────────────────────────────────────────

  async getAuditLogs(query?: any): Promise<{ logs: any[] }> {
    const params = new URLSearchParams(query as any).toString();
    return this.request(`/audit/logs${params ? `?${params}` : ''}`);
  }

  async getAuditStatistics(query?: any): Promise<{ statistics: any }> {
    const params = new URLSearchParams(query as any).toString();
    return this.request(`/audit/statistics${params ? `?${params}` : ''}`);
  }

  async getSecurityAlerts(timeWindow?: number): Promise<{ alerts: any[] }> {
    const params = timeWindow ? `?timeWindow=${timeWindow}` : '';
    return this.request(`/audit/alerts${params}`);
  }

  async getAuditReport(query?: any): Promise<{ report: any }> {
    const params = new URLSearchParams(query as any).toString();
    return this.request(`/audit/report${params ? `?${params}` : ''}`);
  }
}

export const securityApi = new SecurityApi();
