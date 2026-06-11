// routes/security.ts - API endpoints for advanced security features
import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  zeroKnowledgeProofService
} from "../services/security/zeroKnowledgeProof.js";
import {
  quantumResistantEncryptionService
} from "../services/security/quantumResistantEncryption.js";
import {
  secureEnclaveService
} from "../services/security/secureEnclave.js";
import {
  blockchainEvidenceService,
  EvidenceData
} from "../services/security/blockchainEvidence.js";
import {
  multiFactorBiometricsService
} from "../services/security/multiFactorBiometrics.js";
import {
  securityAuditService,
  AuditQuery
} from "../services/security/securityAudit.js";

interface ZodErrorLike {
  errors: Array<{ message: string; path: (string | number)[] }>;
}

const router = Router();

type AuthRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
}

// ── Zero-Knowledge Proofs ─────────────────────────────────────────────────────

router.post("/zk/ownership-proof", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      userId: z.string()
    });
    const { deviceId, userId } = schema.parse(req.body);

    const proof = await zeroKnowledgeProofService.generateOwnershipProof(deviceId, userId);
    
    await securityAuditService.logEvent({
      userId,
      deviceId,
      eventType: 'zk_ownership_proof',
      eventCategory: 'zk_proof',
      severity: 'medium',
      details: { proofId: proof.verificationKey },
      success: true,
      metadata: {}
    });

    res.json({ proof });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/zk/verify-proof", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      proof: z.object({
        proof: z.string(),
        publicInputs: z.array(z.any()),
        verificationKey: z.string()
      }),
      deviceId: z.string()
    });
    const { proof, deviceId } = schema.parse(req.body);

    const result = await zeroKnowledgeProofService.verifyProof(proof, deviceId);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      deviceId,
      eventType: 'zk_verify_proof',
      eventCategory: 'zk_proof',
      severity: result.isValid ? 'low' : 'high',
      details: { isValid: result.isValid },
      success: result.isValid,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── Quantum-Resistant Encryption ───────────────────────────────────────────────

router.post("/quantum/generate-keypair", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      algorithm: z.string().optional()
    });
    const { algorithm } = schema.parse(req.body);

    const keyPair = await quantumResistantEncryptionService.generateKeyPair(algorithm);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'quantum_keypair_generation',
      eventCategory: 'quantum_crypto',
      severity: 'medium',
      details: { keyId: keyPair.keyId, algorithm: keyPair.algorithm },
      success: true,
      metadata: {}
    });

    res.json({ keyPair });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/quantum/encrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      plaintext: z.string(),
      publicKey: z.string(),
      algorithm: z.string().optional()
    });
    const { plaintext, publicKey, algorithm } = schema.parse(req.body);

    const result = await quantumResistantEncryptionService.encrypt(plaintext, publicKey, algorithm);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'quantum_encryption',
      eventCategory: 'quantum_crypto',
      severity: 'medium',
      details: { keyId: result.keyId, algorithm: result.algorithm },
      success: true,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/quantum/decrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      encryptedData: z.object({
        ciphertext: z.string(),
        nonce: z.string(),
        keyId: z.string(),
        algorithm: z.string()
      }),
      privateKey: z.string()
    });
    const { encryptedData, privateKey } = schema.parse(req.body);

    const result = await quantumResistantEncryptionService.decrypt(encryptedData, privateKey);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'quantum_decryption',
      eventCategory: 'quantum_crypto',
      severity: result.success ? 'low' : 'high',
      details: { success: result.success },
      success: result.success,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── Secure Enclave ─────────────────────────────────────────────────────────────

router.post("/enclave/generate-key", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      keyType: z.enum(['symmetric', 'asymmetric']).optional(),
      accessLevel: z.enum(['user', 'admin', 'system']).optional(),
      ttl: z.number().optional()
    });
    const { keyType, accessLevel, ttl } = schema.parse(req.body);

    const key = await secureEnclaveService.generateSecureKey(keyType, accessLevel, ttl);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'enclave_key_generation',
      eventCategory: 'secure_enclave',
      severity: 'medium',
      details: { keyId: key.keyId, keyType: key.keyType },
      success: true,
      metadata: {}
    });

    res.json({ key });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/enclave/encrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      plaintext: z.string(),
      keyId: z.string(),
      accessLevel: z.enum(['user', 'admin', 'system']).optional()
    });
    const { plaintext, keyId, accessLevel } = schema.parse(req.body);

    const result = await secureEnclaveService.encryptData(plaintext, keyId, accessLevel);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'enclave_encryption',
      eventCategory: 'secure_enclave',
      severity: 'medium',
      details: { dataId: result.dataId },
      success: true,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/enclave/decrypt", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  let dataId = '';
  try {
    const schema = z.object({
      dataId: z.string(),
      accessLevel: z.enum(['user', 'admin', 'system']).optional()
    });
    const parsed = schema.parse(req.body);
    dataId = parsed.dataId;
    const accessLevel = parsed.accessLevel;

    const plaintext = await secureEnclaveService.decryptData(dataId, accessLevel);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'enclave_decryption',
      eventCategory: 'secure_enclave',
      severity: 'low',
      details: { dataId },
      success: true,
      metadata: {}
    });

    res.json({ plaintext });
  } catch (err) {
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      eventType: 'enclave_decryption',
      eventCategory: 'secure_enclave',
      severity: 'high',
      details: { dataId },
      success: false,
      errorMessage: err instanceof Error ? err.message : 'Unknown error',
      metadata: {}
    });
    
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/enclave/attestation", authenticate, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const attestation = await secureEnclaveService.attestEnclave();
    res.json({ attestation });
  } catch (err) {
    next(err);
  }
});

// ── Blockchain Evidence Chain ───────────────────────────────────────────────────

router.post("/blockchain/add-evidence", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      deviceId: z.string(),
      eventType: z.string(),
      eventData: z.any(),
      userId: z.string().optional(),
      location: z.object({ lat: z.number(), lng: z.number() }).optional(),
      metadata: z.object({
        source: z.string(),
        trustLevel: z.number(),
        verified: z.boolean()
      })
    });
    const data = schema.parse(req.body);

    const result = await blockchainEvidenceService.addEvidence(data as unknown as EvidenceData);
    
    await securityAuditService.logEvent({
      userId: req.user?.id as string,
      deviceId: data.deviceId,
      eventType: 'blockchain_evidence_added',
      eventCategory: 'blockchain',
      severity: 'medium',
      details: { blockNumber: result.block.blockNumber, isValid: result.isValid },
      success: result.isValid,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.get("/blockchain/evidence/:blockNumber", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const blockNumber = parseInt(req.params.blockNumber as string);
    const evidence = blockchainEvidenceService.getEvidence(blockNumber);
    
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    res.json({ evidence });
  } catch (err) {
    next(err);
  }
});

router.get("/blockchain/device/:deviceId", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const deviceId = req.params.deviceId as string;
    const evidence = blockchainEvidenceService.getEvidenceByDevice(deviceId);
    res.json({ evidence });
  } catch (err) {
    next(err);
  }
});

router.get("/blockchain/verify", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const isValid = blockchainEvidenceService.verifyChain();
    res.json({ isValid, chainLength: blockchainEvidenceService.getChainLength() });
  } catch (err) {
    next(err);
  }
});

router.get("/blockchain/statistics", authenticate, requireAdmin, async (_req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const stats = blockchainEvidenceService.getStatistics();
    res.json({ stats });
  } catch (err) {
    next(err);
  }
});

// ── Multi-Factor Biometrics ────────────────────────────────────────────────────

router.post("/biometrics/enroll-face", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      faceData: z.string(),
      qualityThreshold: z.number().optional()
    });
    const { userId, faceData, qualityThreshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.enrollFace(userId, faceData, qualityThreshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_face_enrollment',
      eventCategory: 'biometrics',
      severity: result.success ? 'medium' : 'low',
      details: { templateId: result.templateId, quality: result.quality },
      success: result.success,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/enroll-voice", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      voiceData: z.string(),
      qualityThreshold: z.number().optional()
    });
    const { userId, voiceData, qualityThreshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.enrollVoice(userId, voiceData, qualityThreshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_voice_enrollment',
      eventCategory: 'biometrics',
      severity: result.success ? 'medium' : 'low',
      details: { templateId: result.templateId, quality: result.quality },
      success: result.success,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/enroll-fingerprint", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      fingerprintData: z.string(),
      qualityThreshold: z.number().optional()
    });
    const { userId, fingerprintData, qualityThreshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.enrollFingerprint(userId, fingerprintData, qualityThreshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_fingerprint_enrollment',
      eventCategory: 'biometrics',
      severity: result.success ? 'medium' : 'low',
      details: { templateId: result.templateId, quality: result.quality },
      success: result.success,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/authenticate-face", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      faceData: z.string(),
      threshold: z.number().optional()
    });
    const { userId, faceData, threshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.authenticateFace(userId, faceData, threshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_face_authentication',
      eventCategory: 'biometrics',
      severity: result.isMatch ? 'low' : 'high',
      details: { confidence: result.confidence },
      success: result.isMatch,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/authenticate-voice", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      voiceData: z.string(),
      threshold: z.number().optional()
    });
    const { userId, voiceData, threshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.authenticateVoice(userId, voiceData, threshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_voice_authentication',
      eventCategory: 'biometrics',
      severity: result.isMatch ? 'low' : 'high',
      details: { confidence: result.confidence },
      success: result.isMatch,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/authenticate-fingerprint", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      fingerprintData: z.string(),
      threshold: z.number().optional()
    });
    const { userId, fingerprintData, threshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.authenticateFingerprint(userId, fingerprintData, threshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_fingerprint_authentication',
      eventCategory: 'biometrics',
      severity: result.isMatch ? 'low' : 'high',
      details: { confidence: result.confidence },
      success: result.isMatch,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

router.post("/biometrics/multi-factor", authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      userId: z.string(),
      biometricData: z.object({
        face: z.string().optional(),
        voice: z.string().optional(),
        fingerprint: z.string().optional()
      }),
      requiredFactors: z.number().optional(),
      threshold: z.number().optional()
    });
    const { userId, biometricData, requiredFactors, threshold } = schema.parse(req.body);

    const result = await multiFactorBiometricsService.multiFactorAuthenticate(userId, biometricData, requiredFactors, threshold);
    
    await securityAuditService.logEvent({
      userId,
      eventType: 'biometric_multi_factor_authentication',
      eventCategory: 'biometrics',
      severity: result.success ? 'low' : 'high',
      details: { overallConfidence: result.overallConfidence, factorsUsed: result.results.length },
      success: result.success,
      metadata: {}
    });

    res.json({ result });
  } catch (err) {
    if (err instanceof Error && err.name === "ZodError") return res.status(400).json({ error: (err as unknown as ZodErrorLike).errors });
    next(err);
  }
});

// ── Security Audit ─────────────────────────────────────────────────────────────

router.get("/audit/logs", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      userId: req.query.userId as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      eventType: req.query.eventType as string | undefined,
      eventCategory: req.query.eventCategory as AuditQuery['eventCategory'],
      severity: req.query.severity as AuditQuery['severity'],
      startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
    };

    const logs = await securityAuditService.queryLogs(query);
    res.json({ logs });
  } catch (err) {
    next(err);
  }
});

router.get("/audit/statistics", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      userId: req.query.userId as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      eventCategory: req.query.eventCategory as AuditQuery['eventCategory'],
      startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined
    };

    const statistics = await securityAuditService.getStatistics(query);
    res.json({ statistics });
  } catch (err) {
    next(err);
  }
});

router.get("/audit/alerts", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const timeWindow = req.query.timeWindow ? parseInt(req.query.timeWindow as string) : undefined;
    const alerts = await securityAuditService.getSecurityAlerts(timeWindow);
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
});

router.get("/audit/report", authenticate, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const query = {
      userId: req.query.userId as string | undefined,
      deviceId: req.query.deviceId as string | undefined,
      eventCategory: req.query.eventCategory as AuditQuery['eventCategory'],
      startTime: req.query.startTime ? parseInt(req.query.startTime as string) : undefined,
      endTime: req.query.endTime ? parseInt(req.query.endTime as string) : undefined
    };

    const report = await securityAuditService.generateReport(query);
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

export default router;
