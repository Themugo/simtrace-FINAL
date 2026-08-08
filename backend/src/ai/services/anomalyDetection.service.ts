import { AnomalyModel, IAnomaly } from "../../models/anomaly.model.js";
import { FeatureExtractorService } from "../features/featureExtractor.service.js";
import { IntelligenceEventModel } from "../../models/intelligenceEvent.model.js";
import { logger } from "../../config/logger.js";

export class AnomalyDetectionService {
  /**
   * Run anomaly detection routines on an entity
   */
  public static async detectAnomalies(entityId: string): Promise<IAnomaly[]> {
    const anomalies: IAnomaly[] = [];

    try {
      const features = await FeatureExtractorService.extractFeatures(entityId);

      // Anomaly 1: Location Velocity / Impossible Travel
      if (features.impossibleTravelDetected) {
        const anomaly = await AnomalyModel.create({
          entityId,
          type: "IMPOSSIBLE_TRAVEL_VELOCITY",
          severity: "critical",
          description: "Detected geographic movement velocity exceeding physical transport limits.",
          confidence: 0.94,
        });
        anomalies.push(anomaly);
      }

      // Anomaly 2: Rapid SIM Swapping
      if (features.simChangesCount >= 4) {
        const anomaly = await AnomalyModel.create({
          entityId,
          type: "RAPID_SIM_SWAPPING_PATTERN",
          severity: "warning",
          description: `Entity exhibits abnormal SIM card swapping frequency (${features.simChangesCount} SIMs detected).`,
          confidence: 0.88,
        });
        anomalies.push(anomaly);
      }

      // Anomaly 3: Unusual Activity Spike
      if (features.activityFrequency > 50) {
        const anomaly = await AnomalyModel.create({
          entityId,
          type: "UNUSUAL_ACTIVITY_BURST",
          severity: "info",
          description: `Event frequency spike detected (${features.activityFrequency} events in 7 days).`,
          confidence: 0.75,
        });
        anomalies.push(anomaly);
      }

      logger.info(`[AnomalyDetection] Detected ${anomalies.length} anomalies for entity ${entityId}`);
      return anomalies;
    } catch (err: any) {
      logger.error(`[AnomalyDetection] Error detecting anomalies for ${entityId}: ${err.message}`);
      return [];
    }
  }
}
