// ── Device Intelligence Engine ─────────────────────────────────────────────────────
// Wraps existing digital twin functionality with standardized interface

import pino, { Logger } from "pino";
import { 
  IDeviceIntelligenceEngine, 
  DeviceIntelligenceInput, 
  DeviceIntelligenceOutput, 
  IntelligenceContext 
} from "./interfaces.js";
import { getDeviceDigitalTwin, digitalTwinManager } from "../modules/device-intelligence/index.js";

const log: Logger = pino({ level: "info" }).child({ engine: "device_intelligence" });

export class DeviceIntelligenceEngine implements IDeviceIntelligenceEngine {
  async analyze(input: DeviceIntelligenceInput, context: IntelligenceContext): Promise<DeviceIntelligenceOutput> {
    const startTime = Date.now();
    log.info({ imei: input.imei, stakeholder: context.stakeholder }, "Device intelligence analysis started");

    try {
      const digitalTwin = await this.getDigitalTwin(input.imei);

      const output: DeviceIntelligenceOutput = {
        imei: input.imei,
        digitalTwin,
      };

      // Add predictions if requested
      if (input.includePredictions) {
        output.predictions = this.generatePredictions(digitalTwin);
      }

      const processingTime = Date.now() - startTime;
      log.info({ imei: input.imei, processingTime }, "Device intelligence analysis completed");

      return output;
    } catch (error) {
      log.error({ imei: input.imei, error }, "Device intelligence analysis failed");
      throw error;
    }
  }

  async updateDigitalTwin(imei: string): Promise<void> {
    log.info({ imei }, "Updating digital twin");
    await digitalTwinManager.updateDigitalTwin(imei);
  }

  async getDigitalTwin(imei: string): Promise<DeviceIntelligenceOutput['digitalTwin']> {
    const twin = await getDeviceDigitalTwin(imei);
    return twin;
  }

  private generatePredictions(digitalTwin: DeviceIntelligenceOutput['digitalTwin']): DeviceIntelligenceOutput['predictions'] {
    const predictions: DeviceIntelligenceOutput['predictions'] = {};

    // Predict next location based on movement patterns
    if (digitalTwin.movementPatterns.length > 0) {
      const primaryPattern = digitalTwin.movementPatterns[0];
      if (primaryPattern.typicalLocations.length > 0) {
        const nextLoc = primaryPattern.typicalLocations[0];
        predictions.nextLocation = {
          lat: nextLoc.lat,
          lng: nextLoc.lng,
          confidence: primaryPattern.confidence * nextLoc.frequency,
        };
      }
    }

    // Predict risk trend based on risk history
    if (digitalTwin.riskHistory.length >= 2) {
      const recent = digitalTwin.riskHistory[0].riskScore;
      const previous = digitalTwin.riskHistory[1].riskScore;
      
      if (recent > previous + 10) {
        predictions.riskTrend = 'increasing';
      } else if (recent < previous - 10) {
        predictions.riskTrend = 'decreasing';
      } else {
        predictions.riskTrend = 'stable';
      }
    }

    return predictions;
  }
}

// Singleton instance
export const deviceIntelligenceEngine = new DeviceIntelligenceEngine();
