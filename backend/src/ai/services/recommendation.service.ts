import { RecommendationModel, IRecommendation } from "../../models/recommendation.model.js";
import { FeatureExtractorService } from "../features/featureExtractor.service.js";
import { EntityModel } from "../../models/entity.model.js";
import { logger } from "../../config/logger.js";

export class RecommendationService {
  /**
   * Generate AI investigation recommendations for an entity
   */
  public static async generateRecommendations(entityId: string): Promise<IRecommendation[]> {
    const recommendations: IRecommendation[] = [];

    try {
      const entity = await EntityModel.findById(entityId);
      if (!entity) return [];

      const features = await FeatureExtractorService.extractFeatures(entityId);

      // Recommendation 1: SIM Swapping
      if (features.simChangesCount >= 3) {
        const rec = await RecommendationModel.create({
          entityId,
          recommendation: `Device ${entity.name} (${entity.externalId}) has changed SIM cards ${features.simChangesCount} times. Recommend issuing subpoena for subscriber SIM records.`,
          priority: features.simChangesCount >= 5 ? "high" : "medium",
        });
        recommendations.push(rec);
      }

      // Recommendation 2: Multi-case linkage
      if (features.caseCount >= 2) {
        const rec = await RecommendationModel.create({
          entityId,
          recommendation: `Entity ${entity.name} is linked to ${features.caseCount} active police investigations. Recommend cross-jurisdictional agency coordination.`,
          priority: "critical",
        });
        recommendations.push(rec);
      }

      // Recommendation 3: Blacklisted node proximity
      if (features.highRiskNodeConnection) {
        const rec = await RecommendationModel.create({
          entityId,
          recommendation: `Direct graph edge discovered connecting ${entity.name} to a blacklisted entity. Recommend urgent investigator review.`,
          priority: "high",
        });
        recommendations.push(rec);
      }

      // Default recommendation if clean
      if (recommendations.length === 0) {
        const rec = await RecommendationModel.create({
          entityId,
          recommendation: `Entity ${entity.name} exhibits standard behavior. Maintain routine monitoring.`,
          priority: "low",
        });
        recommendations.push(rec);
      }

      logger.info(`[RecommendationEngine] Generated ${recommendations.length} recommendations for entity ${entityId}`);
      return recommendations;
    } catch (err: any) {
      logger.error(`[RecommendationEngine] Error generating recommendations: ${err.message}`);
      return [];
    }
  }

  public static async getRecentRecommendations(): Promise<IRecommendation[]> {
    return RecommendationModel.find().sort({ generatedAt: -1 }).limit(20);
  }
}
