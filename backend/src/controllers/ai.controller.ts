import { Request, Response, NextFunction } from "express";
import { RiskEngineService } from "../ai/services/riskEngine.service.js";
import { AnomalyDetectionService } from "../ai/services/anomalyDetection.service.js";
import { RecommendationService } from "../ai/services/recommendation.service.js";
import { IntelligenceAlertModel } from "../models/intelligenceAlert.model.js";
import { AIReviewModel } from "../models/aiReview.model.js";
import { EntityModel } from "../models/entity.model.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { AppError } from "../utils/AppError.js";

export class AIController {
  /**
   * Get entity risk score, factors, and history
   */
  static async getEntityRisk(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { entityId } = req.params;
      const entity = await EntityModel.findById(entityId);
      if (!entity) {
        throw AppError.notFound(`Entity ${entityId} not found`);
      }

      const risk = await RiskEngineService.evaluateEntityRisk(entityId);
      const anomalies = await AnomalyDetectionService.detectAnomalies(entityId);

      sendSuccess(
        res,
        {
          entity: {
            id: entity._id,
            name: entity.name,
            entityType: entity.entityType,
            externalId: entity.externalId,
            status: entity.status,
          },
          riskScore: risk.score,
          riskLevel: risk.level,
          factors: risk.factors,
          anomalies,
          timestamp: new Date().toISOString(),
        },
        "Entity risk evaluation retrieved"
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get active intelligence alerts
   */
  static async getAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, priority } = req.query as { status?: string; priority?: string };
      const filter: any = {};
      if (status) filter.status = status.toUpperCase();
      if (priority) filter.priority = priority.toLowerCase();

      const alerts = await IntelligenceAlertModel.find(filter).sort({ createdAt: -1 }).limit(50);
      sendSuccess(res, { alerts, total: alerts.length }, "Intelligence alerts retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get investigation recommendations
   */
  static async getRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const recommendations = await RecommendationService.getRecentRecommendations();
      sendSuccess(res, { recommendations, count: recommendations.length }, "Investigation recommendations retrieved");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Human Review Endpoint for AI Alerts
   */
  static async reviewAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const reviewerId = (req as any).user?.userId || "investigator_admin";

      if (!decision || !["CONFIRM", "DISMISS", "ESCALATE"].includes(decision)) {
        throw AppError.badRequest("Valid decision ('CONFIRM', 'DISMISS', 'ESCALATE') is required");
      }

      const alert = await IntelligenceAlertModel.findById(id);
      if (!alert) {
        throw AppError.notFound(`Alert ${id} not found`);
      }

      // Update alert status based on human decision
      if (decision === "CONFIRM") alert.status = "CONFIRMED";
      else if (decision === "DISMISS") alert.status = "DISMISSED";
      else if (decision === "ESCALATE") alert.status = "UNDER_REVIEW";

      await alert.save();

      // Log AI Review record
      const reviewRecord = await AIReviewModel.create({
        alertId: id,
        reviewerId,
        decision,
        notes: notes || "",
      });

      sendSuccess(res, { alert, review: reviewRecord }, "AI Alert human review recorded successfully");
    } catch (err) {
      next(err);
    }
  }
}
