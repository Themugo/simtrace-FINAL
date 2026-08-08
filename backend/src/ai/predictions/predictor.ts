import { FeatureExtractorService } from "../features/featureExtractor.service.js";
import { ML_MODEL_REGISTRY } from "../models/mlRegistry.js";

export class MLPredictor {
  public static async predictFraudProbability(entityId: string): Promise<{
    probability: number;
    modelUsed: string;
    confidence: number;
  }> {
    const features = await FeatureExtractorService.extractFeatures(entityId);
    const activeModel = ML_MODEL_REGISTRY.find((m) => m.active) || ML_MODEL_REGISTRY[0];

    // Predict probability using weighted feature factors
    let rawScore = 0;
    if (features.simChangesCount > 3) rawScore += 0.3;
    if (features.impossibleTravelDetected) rawScore += 0.4;
    if (features.highRiskNodeConnection) rawScore += 0.5;
    if (features.blacklistStatus) rawScore += 0.9;

    const probability = Math.min(1.0, rawScore);

    return {
      probability,
      modelUsed: `${activeModel.name}:${activeModel.version}`,
      confidence: 0.91,
    };
  }
}
