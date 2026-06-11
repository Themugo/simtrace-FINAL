// services/security/multiFactorBiometrics.ts - Multi-factor biometric authentication
import crypto from 'crypto';

export interface BiometricTemplate {
  templateId: string;
  userId: string;
  biometricType: 'face' | 'voice' | 'fingerprint';
  templateData: string;
  createdAt: number;
  lastUsed: number;
  confidence: number;
  isActive: boolean;
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

export class MultiFactorBiometricsService {
  private templates: Map<string, BiometricTemplate> = new Map();
  private authenticationHistory: Map<string, BiometricMatchResult[]> = new Map();

  /**
   * Enroll face biometric
   */
  async enrollFace(
    userId: string,
    faceData: string, // Base64 encoded image or feature vector
    qualityThreshold: number = 0.7
  ): Promise<BiometricEnrollmentResult> {
    // Extract features from face data
    const features = this.extractFaceFeatures(faceData);
    const quality = this.assessImageQuality(faceData);

    if (quality < qualityThreshold) {
      return {
        success: false,
        templateId: '',
        quality,
        message: 'Image quality below threshold'
      };
    }

    const templateId = crypto.randomBytes(16).toString('hex');
    const templateData = this.createFaceTemplate(features);

    const template: BiometricTemplate = {
      templateId,
      userId,
      biometricType: 'face',
      templateData,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      confidence: quality,
      isActive: true
    };

    this.templates.set(templateId, template);

    return {
      success: true,
      templateId,
      quality,
      message: 'Face enrollment successful'
    };
  }

  /**
   * Enroll voice biometric
   */
  async enrollVoice(
    userId: string,
    voiceData: string, // Base64 encoded audio
    qualityThreshold: number = 0.7
  ): Promise<BiometricEnrollmentResult> {
    // Extract features from voice data
    const features = this.extractVoiceFeatures(voiceData);
    const quality = this.assessAudioQuality(voiceData);

    if (quality < qualityThreshold) {
      return {
        success: false,
        templateId: '',
        quality,
        message: 'Audio quality below threshold'
      };
    }

    const templateId = crypto.randomBytes(16).toString('hex');
    const templateData = this.createVoiceTemplate(features);

    const template: BiometricTemplate = {
      templateId,
      userId,
      biometricType: 'voice',
      templateData,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      confidence: quality,
      isActive: true
    };

    this.templates.set(templateId, template);

    return {
      success: true,
      templateId,
      quality,
      message: 'Voice enrollment successful'
    };
  }

  /**
   * Enroll fingerprint biometric
   */
  async enrollFingerprint(
    userId: string,
    fingerprintData: string, // Base64 encoded fingerprint image or minutiae data
    qualityThreshold: number = 0.7
  ): Promise<BiometricEnrollmentResult> {
    // Extract features from fingerprint data
    const features = this.extractFingerprintFeatures(fingerprintData);
    const quality = this.assessFingerprintQuality(fingerprintData);

    if (quality < qualityThreshold) {
      return {
        success: false,
        templateId: '',
        quality,
        message: 'Fingerprint quality below threshold'
      };
    }

    const templateId = crypto.randomBytes(16).toString('hex');
    const templateData = this.createFingerprintTemplate(features);

    const template: BiometricTemplate = {
      templateId,
      userId,
      biometricType: 'fingerprint',
      templateData,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      confidence: quality,
      isActive: true
    };

    this.templates.set(templateId, template);

    return {
      success: true,
      templateId,
      quality,
      message: 'Fingerprint enrollment successful'
    };
  }

  /**
   * Authenticate with face
   */
  async authenticateFace(
    userId: string,
    faceData: string,
    threshold: number = 0.8
  ): Promise<BiometricMatchResult> {
    const userTemplates = this.getUserTemplates(userId, 'face');
    
    if (userTemplates.length === 0) {
      return {
        isMatch: false,
        confidence: 0,
        biometricType: 'face',
        timestamp: Date.now(),
        details: {
          similarityScore: 0,
          livenessScore: 0,
          qualityScore: 0
        }
      };
    }

    const features = this.extractFaceFeatures(faceData);
    const livenessScore = this.checkLiveness(faceData);
    const qualityScore = this.assessImageQuality(faceData);

    let bestMatch: { templateId: string; confidence: number } = {
      templateId: '',
      confidence: 0
    };

    for (const template of userTemplates) {
      const similarity = this.compareFaceFeatures(features, template.templateData);
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          templateId: template.templateId,
          confidence: similarity
        };
      }
    }

    const isMatch = bestMatch.confidence >= threshold;
    
    // Update template usage
    if (isMatch && bestMatch.templateId) {
      const template = this.templates.get(bestMatch.templateId);
      if (template) {
        template.lastUsed = Date.now();
        this.templates.set(bestMatch.templateId, template);
      }
    }

    const result: BiometricMatchResult = {
      isMatch,
      confidence: bestMatch.confidence,
      biometricType: 'face',
      timestamp: Date.now(),
      details: {
        similarityScore: bestMatch.confidence,
        livenessScore,
        qualityScore
      }
    };

    // Log authentication attempt
    this.logAuthentication(userId, result);

    return result;
  }

  /**
   * Authenticate with voice
   */
  async authenticateVoice(
    userId: string,
    voiceData: string,
    threshold: number = 0.8
  ): Promise<BiometricMatchResult> {
    const userTemplates = this.getUserTemplates(userId, 'voice');
    
    if (userTemplates.length === 0) {
      return {
        isMatch: false,
        confidence: 0,
        biometricType: 'voice',
        timestamp: Date.now(),
        details: {
          similarityScore: 0,
          livenessScore: 0,
          qualityScore: 0
        }
      };
    }

    const features = this.extractVoiceFeatures(voiceData);
    const livenessScore = this.checkVoiceLiveness(voiceData);
    const qualityScore = this.assessAudioQuality(voiceData);

    let bestMatch: { templateId: string; confidence: number } = {
      templateId: '',
      confidence: 0
    };

    for (const template of userTemplates) {
      const similarity = this.compareVoiceFeatures(features, template.templateData);
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          templateId: template.templateId,
          confidence: similarity
        };
      }
    }

    const isMatch = bestMatch.confidence >= threshold;
    
    // Update template usage
    if (isMatch && bestMatch.templateId) {
      const template = this.templates.get(bestMatch.templateId);
      if (template) {
        template.lastUsed = Date.now();
        this.templates.set(bestMatch.templateId, template);
      }
    }

    const result: BiometricMatchResult = {
      isMatch,
      confidence: bestMatch.confidence,
      biometricType: 'voice',
      timestamp: Date.now(),
      details: {
        similarityScore: bestMatch.confidence,
        livenessScore,
        qualityScore
      }
    };

    // Log authentication attempt
    this.logAuthentication(userId, result);

    return result;
  }

  /**
   * Authenticate with fingerprint
   */
  async authenticateFingerprint(
    userId: string,
    fingerprintData: string,
    threshold: number = 0.8
  ): Promise<BiometricMatchResult> {
    const userTemplates = this.getUserTemplates(userId, 'fingerprint');
    
    if (userTemplates.length === 0) {
      return {
        isMatch: false,
        confidence: 0,
        biometricType: 'fingerprint',
        timestamp: Date.now(),
        details: {
          similarityScore: 0,
          livenessScore: 0,
          qualityScore: 0
        }
      };
    }

    const features = this.extractFingerprintFeatures(fingerprintData);
    const livenessScore = this.checkFingerprintLiveness(fingerprintData);
    const qualityScore = this.assessFingerprintQuality(fingerprintData);

    let bestMatch: { templateId: string; confidence: number } = {
      templateId: '',
      confidence: 0
    };

    for (const template of userTemplates) {
      const similarity = this.compareFingerprintFeatures(features, template.templateData);
      
      if (similarity > bestMatch.confidence) {
        bestMatch = {
          templateId: template.templateId,
          confidence: similarity
        };
      }
    }

    const isMatch = bestMatch.confidence >= threshold;
    
    // Update template usage
    if (isMatch && bestMatch.templateId) {
      const template = this.templates.get(bestMatch.templateId);
      if (template) {
        template.lastUsed = Date.now();
        this.templates.set(bestMatch.templateId, template);
      }
    }

    const result: BiometricMatchResult = {
      isMatch,
      confidence: bestMatch.confidence,
      biometricType: 'fingerprint',
      timestamp: Date.now(),
      details: {
        similarityScore: bestMatch.confidence,
        livenessScore,
        qualityScore
      }
    };

    // Log authentication attempt
    this.logAuthentication(userId, result);

    return result;
  }

  /**
   * Multi-factor authentication using multiple biometrics
   */
  async multiFactorAuthenticate(
    userId: string,
    biometricData: {
      face?: string;
      voice?: string;
      fingerprint?: string;
    },
    requiredFactors: number = 2,
    threshold: number = 0.8
  ): Promise<{
    success: boolean;
    results: BiometricMatchResult[];
    overallConfidence: number;
  }> {
    const results: BiometricMatchResult[] = [];
    
    if (biometricData.face) {
      const faceResult = await this.authenticateFace(userId, biometricData.face, threshold);
      results.push(faceResult);
    }
    
    if (biometricData.voice) {
      const voiceResult = await this.authenticateVoice(userId, biometricData.voice, threshold);
      results.push(voiceResult);
    }
    
    if (biometricData.fingerprint) {
      const fingerprintResult = await this.authenticateFingerprint(userId, biometricData.fingerprint, threshold);
      results.push(fingerprintResult);
    }

    const successfulMatches = results.filter(r => r.isMatch).length;
    const success = successfulMatches >= requiredFactors;
    const overallConfidence = results.length > 0 
      ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length 
      : 0;

    return {
      success,
      results,
      overallConfidence
    };
  }

  /**
   * Get user templates
   */
  getUserTemplates(userId: string, biometricType?: 'face' | 'voice' | 'fingerprint'): BiometricTemplate[] {
    const templates = Array.from(this.templates.values())
      .filter(t => t.userId === userId && t.isActive);
    
    if (biometricType) {
      return templates.filter(t => t.biometricType === biometricType);
    }
    
    return templates;
  }

  /**
   * Delete biometric template
   */
  deleteTemplate(templateId: string): boolean {
    const template = this.templates.get(templateId);
    if (template) {
      template.isActive = false;
      this.templates.set(templateId, template);
      return true;
    }
    return false;
  }

  /**
   * Get authentication history
   */
  getAuthenticationHistory(userId: string, limit: number = 50): BiometricMatchResult[] {
    const history = this.authenticationHistory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Extract face features (simplified)
   */
  private extractFaceFeatures(faceData: string): number[] {
    // In production, this would use actual face recognition libraries
    // For now, we simulate feature extraction
    const hash = crypto.createHash('sha256').update(faceData).digest('hex');
    return hash.split('').map(char => parseInt(char, 16) / 15);
  }

  /**
   * Extract voice features (simplified)
   */
  private extractVoiceFeatures(voiceData: string): number[] {
    const hash = crypto.createHash('sha256').update(voiceData).digest('hex');
    return hash.split('').map(char => parseInt(char, 16) / 15);
  }

  /**
   * Extract fingerprint features (simplified)
   */
  private extractFingerprintFeatures(fingerprintData: string): number[] {
    const hash = crypto.createHash('sha256').update(fingerprintData).digest('hex');
    return hash.split('').map(char => parseInt(char, 16) / 15);
  }

  /**
   * Create face template
   */
  private createFaceTemplate(features: number[]): string {
    return JSON.stringify(features);
  }

  /**
   * Create voice template
   */
  private createVoiceTemplate(features: number[]): string {
    return JSON.stringify(features);
  }

  /**
   * Create fingerprint template
   */
  private createFingerprintTemplate(features: number[]): string {
    return JSON.stringify(features);
  }

  /**
   * Compare face features
   */
  private compareFaceFeatures(features1: number[], templateData: string): number {
    const features2 = JSON.parse(templateData) as number[];
    
    if (features1.length !== features2.length) {
      return 0;
    }

    let sum = 0;
    for (let i = 0; i < features1.length; i++) {
      sum += Math.abs(features1[i] - features2[i]);
    }

    const maxDiff = features1.length;
    return Math.max(0, 1 - (sum / maxDiff));
  }

  /**
   * Compare voice features
   */
  private compareVoiceFeatures(features1: number[], templateData: string): number {
    return this.compareFaceFeatures(features1, templateData);
  }

  /**
   * Compare fingerprint features
   */
  private compareFingerprintFeatures(features1: number[], templateData: string): number {
    return this.compareFaceFeatures(features1, templateData);
  }

  /**
   * Assess image quality
   */
  private assessImageQuality(_imageData: string): number {
    // Simulated quality assessment
    return 0.8 + Math.random() * 0.2;
  }

  /**
   * Assess audio quality
   */
  private assessAudioQuality(_audioData: string): number {
    return 0.8 + Math.random() * 0.2;
  }

  /**
   * Assess fingerprint quality
   */
  private assessFingerprintQuality(_fingerprintData: string): number {
    return 0.8 + Math.random() * 0.2;
  }

  /**
   * Check liveness for face
   */
  private checkLiveness(_faceData: string): number {
    // Simulated liveness detection
    return 0.85 + Math.random() * 0.15;
  }

  /**
   * Check liveness for voice
   */
  private checkVoiceLiveness(_voiceData: string): number {
    return 0.85 + Math.random() * 0.15;
  }

  /**
   * Check liveness for fingerprint
   */
  private checkFingerprintLiveness(_fingerprintData: string): number {
    return 0.85 + Math.random() * 0.15;
  }

  /**
   * Log authentication attempt
   */
  private logAuthentication(userId: string, result: BiometricMatchResult): void {
    const history = this.authenticationHistory.get(userId) || [];
    history.push(result);
    
    // Keep only last 100 attempts
    if (history.length > 100) {
      history.shift();
    }
    
    this.authenticationHistory.set(userId, history);
  }

  /**
   * Get biometric statistics
   */
  getStatistics(): {
    totalTemplates: number;
    activeTemplates: number;
    biometricTypes: { face: number; voice: number; fingerprint: number };
    totalAuthentications: number;
  } {
    const templates = Array.from(this.templates.values());
    const activeTemplates = templates.filter(t => t.isActive);
    
    const biometricTypes = {
      face: 0,
      voice: 0,
      fingerprint: 0
    };
    
    for (const template of activeTemplates) {
      biometricTypes[template.biometricType]++;
    }

    let totalAuthentications = 0;
    for (const history of this.authenticationHistory.values()) {
      totalAuthentications += history.length;
    }

    return {
      totalTemplates: templates.length,
      activeTemplates: activeTemplates.length,
      biometricTypes,
      totalAuthentications
    };
  }
}

export const multiFactorBiometricsService = new MultiFactorBiometricsService();
