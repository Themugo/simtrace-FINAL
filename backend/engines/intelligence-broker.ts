// ── Intelligence Broker ────────────────────────────────────────────────────────────
// Coordinates between the four core engines and routes intelligence to stakeholders

import pino, { Logger } from "pino";
import { EventEmitter } from "events";
import {
  IIntelligenceBroker,
  BrokerRequest,
  BrokerResponse,
  IntelligenceContext,
  IntelligenceEvent,
  IEventEmitter,
  DeviceIntelligenceInput,
  RiskScoringInput,
  FraudDetectionInput,
  RecoveryAlertInput,
  DeviceIntelligenceOutput,
  RiskScoringOutput,
  FraudDetectionOutput,
  Stakeholder,
} from "./interfaces.js";
import { deviceIntelligenceEngine } from "./device-intelligence-engine.js";
import { riskScoringEngine } from "./risk-scoring-engine.js";
import { fraudDetectionEngine } from "./fraud-detection-engine.js";
import { recoveryAlertEngine } from "./recovery-alert-engine.js";

const log: Logger = pino({ level: "info" }).child({ broker: "intelligence" });

class IntelligenceEventEmitter implements IEventEmitter {
  private emitter: EventEmitter = new EventEmitter();

  emit(event: IntelligenceEvent): void {
    this.emitter.emit(event.type, event);
    this.emitter.emit("all", event);
  }

  on(eventType: string, handler: (event: IntelligenceEvent) => void): void {
    this.emitter.on(eventType, handler);
  }

  off(eventType: string, handler: (event: IntelligenceEvent) => void): void {
    this.emitter.off(eventType, handler);
  }
}

export class IntelligenceBroker implements IIntelligenceBroker {
  private engines: Map<string, any> = new Map();
  private eventEmitter: IntelligenceEventEmitter = new IntelligenceEventEmitter();

  constructor() {
    // Register core engines
    this.registerEngine("device_intelligence", deviceIntelligenceEngine);
    this.registerEngine("risk_scoring", riskScoringEngine);
    this.registerEngine("fraud_detection", fraudDetectionEngine);
    this.registerEngine("recovery_alert", recoveryAlertEngine);

    // Setup event handlers
    this.setupEventHandlers();
  }

  async coordinate(request: BrokerRequest): Promise<BrokerResponse> {
    const startTime = Date.now();
    log.info({ type: request.type, imei: request.context.imei }, "Broker coordination started");

    try {
      let data: any;

      switch (request.type) {
        case "device_intelligence":
          data = await deviceIntelligenceEngine.analyze(request.input as DeviceIntelligenceInput, request.context);
          break;
        case "risk_scoring":
          data = await riskScoringEngine.computeScore(request.input as RiskScoringInput, request.context);
          break;
        case "fraud_detection":
          data = await fraudDetectionEngine.detect(request.input as FraudDetectionInput, request.context);
          break;
        case "recovery_alert":
          data = await recoveryAlertEngine.sendAlert(request.input as RecoveryAlertInput, request.context);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      // Emit event if risk threshold exceeded
      if (request.type === "risk_scoring" && data.overallScore > 75) {
        this.eventEmitter.emit({
          type: "risk_threshold_exceeded",
          imei: request.context.imei,
          timestamp: new Date(),
          data: { riskScore: data.overallScore, threatLevel: data.threatLevel },
          stakeholders: this.getStakeholdersForEvent("risk_threshold_exceeded"),
        });
      }

      // Emit event if fraud detected
      if (request.type === "fraud_detection" && data.isFraudDetected) {
        this.eventEmitter.emit({
          type: "fraud_detected",
          imei: request.context.imei,
          timestamp: new Date(),
          data: { riskScore: data.riskScore, indicators: data.indicators },
          stakeholders: this.getStakeholdersForEvent("fraud_detected"),
        });
      }

      const processingTime = Date.now() - startTime;
      log.info({ type: request.type, processingTime }, "Broker coordination completed");

      return {
        success: true,
        data,
        timestamp: new Date(),
        processingTime,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      log.error({ type: request.type, error }, "Broker coordination failed");

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date(),
        processingTime,
      };
    }
  }

  async analyzeDevice(imei: string, context: IntelligenceContext): Promise<{
    deviceIntelligence: DeviceIntelligenceOutput;
    riskScoring: RiskScoringOutput;
    fraudDetection: FraudDetectionOutput;
  }> {
    log.info({ imei, stakeholder: context.stakeholder }, "Multi-engine device analysis started");

    const startTime = Date.now();

    try {
      // Run all engines in parallel for efficiency
      const [deviceIntelligence, riskScoring, fraudDetection] = await Promise.all([
        deviceIntelligenceEngine.analyze({ imei, includePredictions: true }, context),
        riskScoringEngine.computeScore({ imei, includeFactors: true, includeHistory: true }, context),
        fraudDetectionEngine.detect({ imei, includeThreatIntel: true }, context),
      ]);

      // Emit anomaly event if high risk and fraud detected
      if (riskScoring.overallScore > 50 && fraudDetection.isFraudDetected) {
        this.eventEmitter.emit({
          type: "anomaly_detected",
          imei,
          timestamp: new Date(),
          data: {
            riskScore: riskScoring.overallScore,
            fraudRisk: fraudDetection.riskScore,
            indicators: fraudDetection.indicators,
          },
          stakeholders: this.getStakeholdersForEvent("anomaly_detected"),
        });
      }

      const processingTime = Date.now() - startTime;
      log.info({ imei, processingTime }, "Multi-engine device analysis completed");

      return { deviceIntelligence, riskScoring, fraudDetection };
    } catch (error) {
      log.error({ imei, error }, "Multi-engine device analysis failed");
      throw error;
    }
  }

  async getIntelligenceForStakeholder(stakeholder: Stakeholder, imei: string, context: IntelligenceContext): Promise<any> {
    log.info({ stakeholder, imei }, "Stakeholder-specific intelligence requested");

    const contextWithStakeholder: IntelligenceContext = {
      ...context,
      stakeholder,
    };

    switch (stakeholder) {
      case "device_owner":
        return this.getDeviceOwnerIntelligence(imei, contextWithStakeholder);
      case "telecom_operator":
        return this.getTelecomOperatorIntelligence(imei, contextWithStakeholder);
      case "law_enforcement":
        return this.getLawEnforcementIntelligence(imei, contextWithStakeholder);
      case "internal_admin":
        return this.getInternalAdminIntelligence(imei, contextWithStakeholder);
      default:
        throw new Error(`Unknown stakeholder: ${stakeholder}`);
    }
  }

  registerEngine(name: string, engine: any): void {
    this.engines.set(name, engine);
    log.info({ engine: name }, "Engine registered");
  }

  getEngine(name: string): any {
    return this.engines.get(name);
  }

  // Event emitter interface
  on(eventType: string, handler: (event: IntelligenceEvent) => void): void {
    this.eventEmitter.on(eventType, handler);
  }

  off(eventType: string, handler: (event: IntelligenceEvent) => void): void {
    this.eventEmitter.off(eventType, handler);
  }

  // Private methods for stakeholder-specific intelligence
  private async getDeviceOwnerIntelligence(imei: string, context: IntelligenceContext): Promise<any> {
    const { deviceIntelligence, riskScoring, fraudDetection } = await this.analyzeDevice(imei, context);

    return {
      deviceIntelligence: {
        movementPatterns: deviceIntelligence.digitalTwin.movementPatterns,
        knownLocations: deviceIntelligence.digitalTwin.knownLocations,
        recoveryLikelihood: deviceIntelligence.digitalTwin.recoveryLikelihood,
      },
      riskScoring: {
        overallScore: riskScoring.overallScore,
        threatLevel: riskScoring.threatLevel,
        recommendations: riskScoring.recommendations,
      },
      fraudDetection: {
        isFraudDetected: fraudDetection.isFraudDetected,
        riskScore: fraudDetection.riskScore,
        recommendations: fraudDetection.recommendations,
      },
      actions: {
        canLock: true,
        canWipe: true,
        canTrack: true,
        canReport: true,
      },
    };
  }

  private async getTelecomOperatorIntelligence(imei: string, context: IntelligenceContext): Promise<any> {
    const { riskScoring, fraudDetection } = await this.analyzeDevice(imei, context);

    return {
      riskScoring: {
        overallScore: riskScoring.overallScore,
        threatLevel: riskScoring.threatLevel,
        factors: riskScoring.factors,
      },
      fraudDetection: {
        isFraudDetected: fraudDetection.isFraudDetected,
        riskScore: fraudDetection.riskScore,
        indicators: fraudDetection.indicators,
        attackPatterns: fraudDetection.attackPatterns,
      },
      networkData: {
        simSwaps: riskScoring.factors?.filter(f => f.name === 'sim_swaps'),
        carrierHops: riskScoring.factors?.filter(f => f.name === 'carrier_hops'),
        locationJumps: riskScoring.factors?.filter(f => f.name === 'location_jump'),
      },
      recommendations: [
        "Monitor for SIM swap activity",
        "Flag suspicious carrier changes",
        "Coordinate with law enforcement if fraud detected",
      ],
    };
  }

  private async getLawEnforcementIntelligence(imei: string, context: IntelligenceContext): Promise<any> {
    const { deviceIntelligence, riskScoring, fraudDetection } = await this.analyzeDevice(imei, context);

    return {
      deviceIntelligence: {
        movementPatterns: deviceIntelligence.digitalTwin.movementPatterns,
        knownLocations: deviceIntelligence.digitalTwin.knownLocations,
        behaviorProfile: deviceIntelligence.digitalTwin.behaviorProfile,
        recoveryLikelihood: deviceIntelligence.digitalTwin.recoveryLikelihood,
      },
      riskScoring: {
        overallScore: riskScoring.overallScore,
        threatLevel: riskScoring.threatLevel,
        history: riskScoring.history,
        factors: riskScoring.factors,
      },
      fraudDetection: {
        isFraudDetected: fraudDetection.isFraudDetected,
        riskScore: fraudDetection.riskScore,
        indicators: fraudDetection.indicators,
        attackPatterns: fraudDetection.attackPatterns,
        threatIntel: fraudDetection.threatIntel,
      },
      investigation: {
        priority: this.getInvestigationPriority(riskScoring.overallScore, fraudDetection.riskScore),
        recommendedActions: this.getRecommendedActions(riskScoring.threatLevel, fraudDetection.isFraudDetected),
        evidence: this.gatherEvidence(deviceIntelligence, riskScoring, fraudDetection),
      },
    };
  }

  private async getInternalAdminIntelligence(imei: string, context: IntelligenceContext): Promise<any> {
    const { deviceIntelligence, riskScoring, fraudDetection } = await this.analyzeDevice(imei, context);

    return {
      deviceIntelligence,
      riskScoring,
      fraudDetection,
      system: {
        processingTime: Date.now(),
        enginesStatus: Array.from(this.engines.keys()),
        eventHistory: this.getRecentEvents(imei),
      },
    };
  }

  private setupEventHandlers(): void {
    this.eventEmitter.on("risk_threshold_exceeded", (event) => {
      log.warn({ imei: event.imei, data: event.data }, "Risk threshold exceeded event");
      // Trigger automatic actions based on risk level
      if (event.data.riskScore > 90) {
        this.eventEmitter.emit({
          type: "recovery_triggered",
          imei: event.imei,
          timestamp: new Date(),
          data: { reason: "Critical risk threshold exceeded" },
          stakeholders: ["device_owner", "law_enforcement"],
        });
      }
    });

    this.eventEmitter.on("fraud_detected", (event) => {
      log.warn({ imei: event.imei, data: event.data }, "Fraud detected event");
    });

    this.eventEmitter.on("anomaly_detected", (event) => {
      log.warn({ imei: event.imei, data: event.data }, "Anomaly detected event");
    });

    this.eventEmitter.on("recovery_triggered", (event) => {
      log.info({ imei: event.imei, data: event.data }, "Recovery triggered event");
    });
  }

  private getStakeholdersForEvent(eventType: string): Stakeholder[] {
    switch (eventType) {
      case "risk_threshold_exceeded":
        return ["device_owner", "internal_admin"];
      case "fraud_detected":
        return ["device_owner", "telecom_operator", "law_enforcement", "internal_admin"];
      case "anomaly_detected":
        return ["device_owner", "law_enforcement", "internal_admin"];
      case "recovery_triggered":
        return ["device_owner", "law_enforcement"];
      default:
        return ["internal_admin"];
    }
  }

  private getInvestigationPriority(riskScore: number, fraudScore: number): 'low' | 'medium' | 'high' | 'critical' {
    const combinedScore = (riskScore + fraudScore) / 2;
    if (combinedScore >= 75) return 'critical';
    if (combinedScore >= 50) return 'high';
    if (combinedScore >= 25) return 'medium';
    return 'low';
  }

  private getRecommendedActions(threatLevel: string, isFraudDetected: boolean): string[] {
    const actions: string[] = [];

    if (threatLevel === 'CRITICAL') {
      actions.push("Immediate device lock recommended");
      actions.push("Coordinate with law enforcement");
      actions.push("Initiate recovery procedures");
    }

    if (isFraudDetected) {
      actions.push("Investigate fraud indicators");
      actions.push("Review attack patterns");
      actions.push("Check threat intelligence");
    }

    if (threatLevel === 'HIGH') {
      actions.push("Enhanced monitoring recommended");
      actions.push("Verify device owner identity");
    }

    return actions;
  }

  private gatherEvidence(deviceIntelligence: DeviceIntelligenceOutput, riskScoring: RiskScoringOutput, fraudDetection: FraudDetectionOutput): any {
    return {
      movementHistory: deviceIntelligence.digitalTwin.movementPatterns,
      riskFactors: riskScoring.factors,
      fraudIndicators: fraudDetection.indicators,
      attackPatterns: fraudDetection.attackPatterns,
      threatIntel: fraudDetection.threatIntel,
      timestamp: new Date(),
    };
  }

  private getRecentEvents(_imei: string): IntelligenceEvent[] {
    // In production, this would query a database
    return [];
  }
}

// Singleton instance
export const intelligenceBroker = new IntelligenceBroker();
