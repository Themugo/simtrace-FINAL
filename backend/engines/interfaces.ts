// ── Core Engine Interfaces ───────────────────────────────────────────────────────
// TypeScript-first, production-grade interfaces for the four core engines

// ── Stakeholder Types ─────────────────────────────────────────────────────────────
export type Stakeholder = 'device_owner' | 'telecom_operator' | 'law_enforcement' | 'internal_admin';

export interface IntelligenceContext {
  imei: string;
  stakeholder: Stakeholder;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ── Device Intelligence Engine ───────────────────────────────────────────────────
export interface DeviceIntelligenceInput {
  imei: string;
  includeHistory?: boolean;
  includePredictions?: boolean;
}

export interface DeviceIntelligenceOutput {
  imei: string;
  digitalTwin: {
    riskHistory: Array<{
      timestamp: Date;
      riskScore: number;
      threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      riskFactors: string[];
    }>;
    movementPatterns: Array<{
      patternType: 'commute' | 'random' | 'stationary' | 'travel';
      typicalLocations: Array<{ lat: number; lng: number; frequency: number }>;
      typicalTimes: Array<{ hour: number; frequency: number }>;
      averageSpeed: number;
      confidence: number;
    }>;
    knownLocations: Array<{
      lat: number;
      lng: number;
      name?: string;
      type: 'home' | 'work' | 'frequent' | 'transit';
      visitCount: number;
      firstSeen: Date;
      lastSeen: Date;
      avgStayDuration: number;
    }>;
    behaviorProfile: {
      activityLevel: 'low' | 'medium' | 'high';
      typicalDayStart: number;
      typicalDayEnd: number;
      mobilityScore: number;
      predictabilityScore: number;
      anomalyCount: number;
    };
    recoveryLikelihood: number;
  };
  predictions?: {
    nextLocation?: { lat: number; lng: number; confidence: number };
    riskTrend?: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface IDeviceIntelligenceEngine {
  analyze(input: DeviceIntelligenceInput, context: IntelligenceContext): Promise<DeviceIntelligenceOutput>;
  updateDigitalTwin(imei: string): Promise<void>;
  getDigitalTwin(imei: string): Promise<DeviceIntelligenceOutput['digitalTwin']>;
}

// ── Risk Scoring Engine ───────────────────────────────────────────────────────────
export interface RiskScoringInput {
  imei: string;
  includeFactors?: boolean;
  includeHistory?: boolean;
}

export interface RiskFactor {
  name: string;
  value: number;
  weight: number;
  description: string;
}

export interface RiskScoringOutput {
  imei: string;
  overallScore: number; // 0-100
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors?: RiskFactor[];
  history?: Array<{
    timestamp: Date;
    score: number;
    threatLevel: string;
  }>;
  confidence: number; // 0-1
  recommendations: string[];
}

export interface IRiskScoringEngine {
  computeScore(input: RiskScoringInput, context: IntelligenceContext): Promise<RiskScoringOutput>;
  getRiskFactors(imei: string): Promise<RiskFactor[]>;
  getRiskHistory(imei: string, days?: number): Promise<RiskScoringOutput['history']>;
}

// ── Fraud Detection Engine ────────────────────────────────────────────────────────
export interface FraudDetectionInput {
  imei: string;
  indicators?: string[];
  includeThreatIntel?: boolean;
}

export interface FraudIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: any;
  timestamp: Date;
}

export interface FraudDetectionOutput {
  imei: string;
  isFraudDetected: boolean;
  riskScore: number; // 0-100
  indicators: FraudIndicator[];
  attackPatterns?: Array<{
    name: string;
    description: string;
    severity: string;
    confidence: number;
    mitigation: string[];
  }>;
  threatIntel?: Array<{
    type: string;
    value: string;
    threatType: string;
    severity: string;
    source: string;
    confidence: number;
  }>;
  recommendations: string[];
}

export interface IFraudDetectionEngine {
  detect(input: FraudDetectionInput, context: IntelligenceContext): Promise<FraudDetectionOutput>;
  addIndicator(indicator: Omit<FraudIndicator, 'timestamp'>): Promise<void>;
  checkThreatIntel(imei: string, indicators: string[]): Promise<FraudDetectionOutput['threatIntel']>;
}

// ── Recovery & Alert Engine ───────────────────────────────────────────────────────
export interface RecoveryAlertInput {
  imei: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  channels?: Array<'sms' | 'email' | 'push' | 'in_app'>;
  stakeholders?: Stakeholder[];
  metadata?: Record<string, any>;
}

export interface RecoveryActions {
  remoteLock: boolean;
  remoteWipe: boolean;
  locationTracking: boolean;
  networkBlacklist: boolean;
  policeAlert: boolean;
}

export interface RecoveryAlertOutput {
  imei: string;
  alertId: string;
  sent: boolean;
  channels: Array<{
    type: string;
    status: 'sent' | 'failed' | 'pending';
    timestamp: Date;
  }>;
  actionsTriggered: RecoveryActions;
  recoveryStatus: 'not_started' | 'in_progress' | 'successful' | 'failed';
  nextSteps: string[];
}

export interface IRecoveryAlertEngine {
  sendAlert(input: RecoveryAlertInput, context: IntelligenceContext): Promise<RecoveryAlertOutput>;
  triggerRecoveryActions(imei: string, actions: Partial<RecoveryActions>): Promise<RecoveryActions>;
  getRecoveryStatus(imei: string): Promise<RecoveryAlertOutput['recoveryStatus']>;
  updateNotificationPreferences(userId: string, preferences: any): Promise<void>;
}

// ── Intelligence Broker ────────────────────────────────────────────────────────────
export interface BrokerRequest {
  type: 'device_intelligence' | 'risk_scoring' | 'fraud_detection' | 'recovery_alert';
  input: any;
  context: IntelligenceContext;
}

export interface BrokerResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
  processingTime: number;
}

export interface IIntelligenceBroker {
  // Engine coordination
  coordinate(request: BrokerRequest): Promise<BrokerResponse>;
  
  // Multi-engine analysis
  analyzeDevice(imei: string, context: IntelligenceContext): Promise<{
    deviceIntelligence: DeviceIntelligenceOutput;
    riskScoring: RiskScoringOutput;
    fraudDetection: FraudDetectionOutput;
  }>;
  
  // Stakeholder-specific intelligence
  getIntelligenceForStakeholder(stakeholder: Stakeholder, imei: string, context: IntelligenceContext): Promise<any>;
  
  // Engine registration
  registerEngine(name: string, engine: any): void;
  getEngine(name: string): any;
}

// ── Event Types for Broker ────────────────────────────────────────────────────────
export interface IntelligenceEvent {
  type: 'risk_threshold_exceeded' | 'fraud_detected' | 'anomaly_detected' | 'recovery_triggered';
  imei: string;
  timestamp: Date;
  data: any;
  stakeholders: Stakeholder[];
}

export interface IEventEmitter {
  emit(event: IntelligenceEvent): void;
  on(eventType: string, handler: (event: IntelligenceEvent) => void): void;
  off(eventType: string, handler: (event: IntelligenceEvent) => void): void;
}
