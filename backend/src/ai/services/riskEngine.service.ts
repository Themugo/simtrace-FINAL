import { FeatureExtractorService, EntityFeatureSet } from "../features/featureExtractor.service.js";
import { EntityModel } from "../../models/entity.model.js";
import { RiskAssessmentModel, RiskLevel } from "../../models/riskAssessment.model.js";
import { IntelligenceAlertModel, AlertType } from "../../models/intelligenceAlert.model.js";
import { AIModelLogModel } from "../../models/aiModelLog.model.js";
import { broadcastEvent } from "../../websocket/socket.server.js";
import { createEvent } from "../../events/types.js";
import { logger } from "../../config/logger.js";
import { AppError } from "../../utils/AppError.js";

export class RiskEngineService {
  /**
   * Evaluate risk for an entity using Rule Engine and Feature Extractor
   */
  public static async evaluateEntityRisk(entityId: string): Promise<{
    score: number;
    level: RiskLevel;
    factors: Array<{ factor: string; points: number; description: string }>;
  }> {
    try {
      const features: EntityFeatureSet = await FeatureExtractorService.extractFeatures(entityId);
      const factors: Array<{ factor: string; points: number; description: string }> = [];
      let score = 0;

      // RULE 001: Multiple SIM changes (>5 SIM changes -> risk +30)
      if (features.simChangesCount >= 5) {
        score += 30;
        factors.push({
          factor: "RULE_001_MULTIPLE_SIM_CHANGES",
          points: 30,
          description: `Device associated with ${features.simChangesCount} distinct SIM cards (exceeds threshold of 5)`,
        });
      } else if (features.simChangesCount >= 3) {
        score += 15;
        factors.push({
          factor: "ELEVATED_SIM_CHANGES",
          points: 15,
          description: `Device associated with ${features.simChangesCount} distinct SIM cards`,
        });
      }

      // RULE 002: Impossible travel
      if (features.impossibleTravelDetected) {
        score += 40;
        factors.push({
          factor: "RULE_002_IMPOSSIBLE_TRAVEL",
          points: 40,
          description: "Entity exhibited spatial displacement velocity exceeding physical feasibility",
        });
      }

      // RULE 003: Known suspicious connection
      if (features.highRiskNodeConnection) {
        score += 50;
        factors.push({
          factor: "RULE_003_SUSPICIOUS_NODE_CONNECTION",
          points: 50,
          description: "Entity is directly linked in the graph to a blacklisted or high-risk node",
        });
      }

      // RULE 004: Case clustering
      if (features.caseCount >= 2) {
        score += 35;
        factors.push({
          factor: "RULE_004_CASE_CLUSTERING",
          points: 35,
          description: `Entity appears in ${features.caseCount} separate active investigations`,
        });
      }

      // Blacklist Status Check
      if (features.blacklistStatus) {
        score += 80;
        factors.push({
          factor: "BLACKLISTED_STATUS",
          points: 80,
          description: "Entity is explicitly flagged as stolen or blacklisted in national repository",
        });
      }

      // Cap max score at 100
      score = Math.min(100, score);

      // Determine Risk Level
      let level: RiskLevel = "LOW";
      if (score >= 76) level = "CRITICAL";
      else if (score >= 51) level = "HIGH";
      else if (score >= 26) level = "MEDIUM";

      // Save entity risk score
      const entity = await EntityModel.findById(entityId);
      if (entity) {
        entity.riskScore = score;
        await entity.save();
      }

      // Create Risk Assessment record
      await RiskAssessmentModel.create({
        entityId,
        score,
        level,
        factors,
      });

      // Log Model evaluation
      await AIModelLogModel.create({
        modelName: "SimTrace-RiskEngine-RuleSet-v1",
        version: "1.2.0",
        input: features,
        output: { score, level, factorsCount: factors.length },
      });

      // Trigger Alert if score >= 50
      if (score >= 51) {
        let alertType: AlertType = "HIGH_RISK_DEVICE";
        if (features.simChangesCount >= 5) alertType = "SUSPICIOUS_SIM_ACTIVITY";
        else if (features.impossibleTravelDetected) alertType = "LOCATION_ANOMALY";
        else if (features.caseCount >= 2) alertType = "NETWORK_CLUSTER";

        const existingAlert = await IntelligenceAlertModel.findOne({
          entityId,
          status: { $in: ["NEW", "UNDER_REVIEW"] },
        });

        if (!existingAlert) {
          const alert = await IntelligenceAlertModel.create({
            entityId,
            organizationId: entity?.organizationId,
            alertType,
            priority: level === "CRITICAL" ? "critical" : "high",
            riskScore: score,
            description: `Automated Risk Engine flagged entity '${entity?.name || entityId}' with risk score ${score} (${level})`,
            status: "NEW",
          });

          // Broadcast real-time event alert
          broadcastEvent(
            createEvent(
              "INTELLIGENCE_ALERT_CREATED",
              "ai-risk-engine",
              { alertId: alert._id, entityId, score, level, alertType },
              level === "CRITICAL" ? "critical" : "warning"
            )
          );
        }
      }

      logger.info(`[AIRiskEngine] Evaluated entity ${entityId}: Score=${score}, Level=${level}`);
      return { score, level, factors };
    } catch (err: any) {
      logger.error(`[AIRiskEngine] Error evaluating entity ${entityId}: ${err.message}`);
      throw AppError.internal("Failed to evaluate AI risk score", err);
    }
  }
}
