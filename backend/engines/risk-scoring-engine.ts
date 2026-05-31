// ── Risk Scoring Engine ───────────────────────────────────────────────────────────
// Wraps existing risk scoring functionality with standardized interface

import pino, { Logger } from "pino";
import { Ping, Device, TrackingEvent } from "../db/index.js";
import { 
  IRiskScoringEngine, 
  RiskScoringInput, 
  RiskScoringOutput, 
  RiskFactor, 
  IntelligenceContext 
} from "./interfaces.js";
import { computeRiskScore as legacyComputeRiskScore } from "../services/intelligence.js";

const log: Logger = pino({ level: "info" }).child({ engine: "risk_scoring" });

export class RiskScoringEngine implements IRiskScoringEngine {
  async computeScore(input: RiskScoringInput, context: IntelligenceContext): Promise<RiskScoringOutput> {
    const startTime = Date.now();
    log.info({ imei: input.imei, stakeholder: context.stakeholder }, "Risk scoring started");

    try {
      // Use legacy computeRiskScore for backward compatibility
      const overallScore = await legacyComputeRiskScore(input.imei);
      
      const threatLevel = this.getThreatLevel(overallScore);
      const factors = input.includeFactors ? await this.getRiskFactors(input.imei) : undefined;
      const history = input.includeHistory ? await this.getRiskHistory(input.imei, 30) : undefined;
      const confidence = this.calculateConfidence(factors, history);
      const recommendations = this.generateRecommendations(threatLevel, factors);

      const output: RiskScoringOutput = {
        imei: input.imei,
        overallScore,
        threatLevel,
        factors,
        history,
        confidence,
        recommendations,
      };

      const processingTime = Date.now() - startTime;
      log.info({ imei: input.imei, overallScore, processingTime }, "Risk scoring completed");

      return output;
    } catch (error) {
      log.error({ imei: input.imei, error }, "Risk scoring failed");
      throw error;
    }
  }

  async getRiskFactors(imei: string): Promise<RiskFactor[]> {
    const device = await Device.findOne({ imei });
    if (!device) return [];

    const factors: RiskFactor[] = [];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentPings = await Ping.find({ imei, ts: { $gte: since } }).sort({ ts: -1 });

    // Device status factor
    if (device.status === "stolen") {
      factors.push({
        name: "device_status",
        value: 80,
        weight: 0.4,
        description: "Device reported as stolen",
      });
    }
    if (device.status === "blacklisted") {
      factors.push({
        name: "device_status",
        value: 100,
        weight: 0.5,
        description: "Device is blacklisted",
      });
    }

    // SIM swap factor
    const simSet = new Set(recentPings.map((p: any) => p.simIccid).filter(Boolean));
    if (simSet.size > 1) {
      factors.push({
        name: "sim_swaps",
        value: simSet.size * 15,
        weight: 0.25,
        description: `${simSet.size - 1} SIM changes detected in 24h`,
      });
    }

    // Location jump factor
    for (let i = 1; i < recentPings.length; i++) {
      const a = recentPings[i - 1];
      const b = recentPings[i];
      const km = this.haversineKm(a.lat, a.lng, b.lat, b.lng);
      const hrs = (Number(a.ts) - Number(b.ts)) / 3600000;
      if (hrs > 0 && km / hrs > 500) {
        factors.push({
          name: "location_jump",
          value: 25,
          weight: 0.2,
          description: "Impossible travel speed detected",
        });
        break;
      }
    }

    // Carrier-hop factor
    const opSet = new Set(recentPings.map((p: any) => p.networkOp).filter(Boolean));
    if (opSet.size > 2) {
      factors.push({
        name: "carrier_hops",
        value: 10,
        weight: 0.15,
        description: `${opSet.size} different carriers detected`,
      });
    }

    // Activity factor
    if (recentPings.length === 0) {
      factors.push({
        name: "no_activity",
        value: 20,
        weight: 0.1,
        description: "No recent activity detected",
      });
    }

    return factors;
  }

  async getRiskHistory(imei: string, days: number = 30): Promise<RiskScoringOutput['history']> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const events = await TrackingEvent.find({ imei, timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(100);

    return events
      .filter((e: any) => e.riskScore !== undefined)
      .map((e: any) => ({
        timestamp: e.timestamp,
        score: e.riskScore || 0,
        threatLevel: e.threatLevel || 'LOW',
      }));
  }

  private getThreatLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 75) return 'CRITICAL';
    if (score >= 50) return 'HIGH';
    if (score >= 25) return 'MEDIUM';
    return 'LOW';
  }

  private calculateConfidence(factors?: RiskFactor[], history?: RiskScoringOutput['history']): number {
    let confidence = 0.5; // Base confidence

    if (factors && factors.length > 0) {
      confidence += 0.2;
    }

    if (history && history.length >= 10) {
      confidence += 0.2;
    }

    if (history && history.length >= 30) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private generateRecommendations(threatLevel: string, factors?: RiskFactor[]): string[] {
    const recommendations: string[] = [];

    switch (threatLevel) {
      case 'CRITICAL':
        recommendations.push('Immediate action required: device may be compromised');
        recommendations.push('Consider remote lock or wipe');
        recommendations.push('Contact law enforcement if device is stolen');
        break;
      case 'HIGH':
        recommendations.push('Monitor device activity closely');
        recommendations.push('Review recent SIM changes and location jumps');
        recommendations.push('Enable additional security measures');
        break;
      case 'MEDIUM':
        recommendations.push('Continue monitoring device behavior');
        recommendations.push('Review risk factors for anomalies');
        break;
      case 'LOW':
        recommendations.push('Normal device activity');
        recommendations.push('Continue routine monitoring');
        break;
    }

    if (factors) {
      const simSwapFactor = factors.find(f => f.name === 'sim_swaps');
      if (simSwapFactor) {
        recommendations.push('Verify SIM swap with carrier');
      }

      const locationJumpFactor = factors.find(f => f.name === 'location_jump');
      if (locationJumpFactor) {
        recommendations.push('Investigate impossible travel patterns');
      }
    }

    return recommendations;
  }

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(d: number): number {
    return (d * Math.PI) / 180;
  }
}

// Singleton instance
export const riskScoringEngine = new RiskScoringEngine();
