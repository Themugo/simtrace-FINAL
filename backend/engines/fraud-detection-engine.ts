// ── Fraud Detection Engine ────────────────────────────────────────────────────────
// Wraps existing fraud detection functionality with standardized interface

import pino, { Logger } from "pino";
import { Ping, Device, Alert } from "../db/index.js";
import { 
  IFraudDetectionEngine, 
  FraudDetectionInput, 
  FraudDetectionOutput, 
  FraudIndicator, 
  IntelligenceContext 
} from "./interfaces.js";
import { 
  checkFraudIndicators, 
  detectAttackPattern, 
  isMaliciousIP 
} from "../intelligence/index.js";
import { runIntelligence } from "../services/intelligence.js";

const log: Logger = pino({ level: "info" }).child({ engine: "fraud_detection" });

export class FraudDetectionEngine implements IFraudDetectionEngine {
  private indicators: Map<string, FraudIndicator> = new Map();

  async detect(input: FraudDetectionInput, _context: IntelligenceContext): Promise<FraudDetectionOutput> {
    log.info({ imei: input.imei }, "Fraud detection started");

    try {
      const device = await Device.findOne({ imei: input.imei }).lean();
      if (!device) {
        return {
          imei: input.imei,
          isFraudDetected: false,
          riskScore: 0,
          indicators: [],
          recommendations: [],
        };
      }

      const indicators: FraudIndicator[] = [];
      let riskScore = 0;

      // Check against cyber intelligence threat database
      if (input.includeThreatIntel) {
        const threatIntel = await this.checkThreatIntel(input.imei, input.indicators || []);
        if (threatIntel && threatIntel.length > 0) {
          riskScore += threatIntel.reduce((sum, t) => sum + (t.severity === 'critical' ? 30 : t.severity === 'high' ? 20 : 10), 0);
        }
      }

      // Run intelligence checks (SIM swap, location jump, fraud pattern)
      // Optimize: Use projection and lean
      const recentPing = await Ping.findOne({ imei: input.imei })
        .select({ imei: 1, ts: 1, lat: 1, lng: 1, sim: 1, ip: 1 })
        .sort({ ts: -1 })
        .lean();
      if (recentPing) {
        // This will trigger the existing intelligence runner
        await runIntelligence({ ping: recentPing, device });
        
        // Check for recent alerts
        // Optimize: Use projection and lean
        const recentAlerts = await Alert.find({ imei: input.imei })
          .select({ imei: 1, ts: 1, type: 1, severity: 1 })
          .sort({ ts: -1 })
          .limit(10)
          .lean();

        for (const alert of recentAlerts) {
          indicators.push({
            type: alert.type,
            severity: this.getAlertSeverity(alert.type),
            confidence: 0.8,
            description: this.getAlertDescription(alert.type, alert.payload),
            evidence: alert.payload,
            timestamp: alert.ts,
          });
          riskScore += this.getSeverityWeight(indicators[indicators.length - 1].severity);
        }
      }

      // Check against fraud indicators
      if (input.indicators && input.indicators.length > 0) {
        const fraudSources = checkFraudIndicators(input.indicators);
        for (const source of fraudSources) {
          indicators.push({
            type: 'fraud_source_match',
            severity: source.confidence > 0.8 ? 'high' : 'medium',
            confidence: source.confidence,
            description: `Match found in fraud source: ${source.source}`,
            evidence: { source, indicators: input.indicators },
            timestamp: new Date(),
          });
          riskScore += source.confidence > 0.8 ? 25 : 15;
        }
      }

      // Detect attack patterns
      if (input.indicators && input.indicators.length > 0) {
        const patterns = detectAttackPattern(input.indicators);
        if (patterns.length > 0) {
          const attackPatterns = patterns.map(p => ({
            name: p.name,
            description: p.description,
            severity: p.severity,
            confidence: 0.7,
            mitigation: p.mitigation,
          }));
          riskScore += patterns.reduce((sum, p) => sum + (p.severity === 'critical' ? 30 : p.severity === 'high' ? 20 : 10), 0);

          return {
            imei: input.imei,
            isFraudDetected: true,
            riskScore: Math.min(riskScore, 100),
            indicators,
            attackPatterns,
            recommendations: this.generateFraudRecommendations(attackPatterns),
          };
        }
      }

      const isFraudDetected = riskScore > 25;

      return {
        imei: input.imei,
        isFraudDetected,
        riskScore: Math.min(riskScore, 100),
        indicators,
        recommendations: this.generateFraudRecommendations(),
      };
    } catch (error) {
      log.error({ imei: input.imei, error }, "Fraud detection failed");
      throw error;
    }
  }

  async addIndicator(indicator: Omit<FraudIndicator, 'timestamp'>): Promise<void> {
    const fraudIndicator: FraudIndicator = {
      ...indicator,
      timestamp: new Date(),
    };
    this.indicators.set(`${indicator.type}_${Date.now()}`, fraudIndicator);
    log.info({ type: indicator.type }, "Fraud indicator added");
  }

  async checkThreatIntel(imei: string, _indicators: string[]): Promise<FraudDetectionOutput['threatIntel']> {
    const device = await Device.findOne({ imei }).lean();
    if (!device) return [];

    const threatIntel: FraudDetectionOutput['threatIntel'] = [];

    // Check recent pings for malicious IPs
    // Optimize: Use projection, limit, and lean
    const recentPings = await Ping.find({ imei })
      .select({ imei: 1, ts: 1, ip: 1 })
      .sort({ ts: -1 })
      .limit(50)
      .lean();
    for (const ping of recentPings) {
      const result = isMaliciousIP((ping as any).ip);
      if (result.isMalicious && result.threat) {
        threatIntel.push({
          type: result.threat.type,
          value: result.threat.value,
          threatType: result.threat.threatType,
          severity: result.threat.severity,
          source: result.threat.source,
          confidence: result.threat.confidence,
        });
      }
    }

    return threatIntel;
  }

  private getAlertSeverity(type: string): FraudIndicator['severity'] {
    switch (type) {
      case 'blacklist_ping':
        return 'critical';
      case 'sim_swap':
        return 'high';
      case 'location_jump':
        return 'high';
      case 'fraud_pattern':
        return 'critical';
      case 'theft_report':
        return 'critical';
      default:
        return 'medium';
    }
  }

  private getAlertDescription(type: string, payload: any): string {
    switch (type) {
      case 'blacklist_ping':
        return `Blacklisted device pinged at [${payload.lat?.toFixed(4)}, ${payload.lng?.toFixed(4)}]`;
      case 'sim_swap':
        return `SIM swap detected: ${payload.oldSim} → ${payload.newSim}`;
      case 'location_jump':
        return `Impossible speed: ${payload.kmh} km/h detected`;
      case 'fraud_pattern':
        return `Carrier-hop fraud: ${payload.operators?.join(", ")}`;
      case 'theft_report':
        return `Device reported as stolen`;
      default:
        return `Security alert: ${type}`;
    }
  }

  private getSeverityWeight(severity: FraudIndicator['severity']): number {
    switch (severity) {
      case 'critical':
        return 30;
      case 'high':
        return 20;
      case 'medium':
        return 10;
      case 'low':
        return 5;
      default:
        return 0;
    }
  }

  private generateFraudRecommendations(attackPatterns?: FraudDetectionOutput['attackPatterns']): string[] {
    const recommendations: string[] = [];

    if (attackPatterns && attackPatterns.length > 0) {
      for (const pattern of attackPatterns) {
        recommendations.push(`Attack pattern detected: ${pattern.name}`);
        recommendations.push(`Mitigation: ${pattern.mitigation.join(", ")}`);
      }
    } else {
      recommendations.push('Monitor device for suspicious activity');
      recommendations.push('Review recent SIM changes and location jumps');
      recommendations.push('Check against threat intelligence databases');
    }

    return recommendations;
  }
}

// Singleton instance
export const fraudDetectionEngine = new FraudDetectionEngine();
