// ── Machine Learning Pipeline ─────────────────────────────────────────────────────────
// ML models for theft prediction, fraud scoring, movement prediction, recovery success

export interface MLModel {
  name: string;
  type: 'theft_prediction' | 'fraud_scoring' | 'movement_prediction' | 'recovery_success';
  version: string;
  status: 'training' | 'ready' | 'error';
  accuracy?: number;
}

export interface MLPrediction {
  model: string;
  prediction: number;
  confidence: number;
  features: Record<string, any>;
  timestamp: Date;
}

export interface MLTrainingData {
  features: Record<string, any>;
  label: number;
  timestamp: Date;
}

class MLPipeline {
  private models: Map<string, MLModel> = new Map();
  private predictions: MLPrediction[] = [];
  private trainingData: MLTrainingData[] = [];

  constructor() {
    this.initializeModels();
  }

  // Initialize default models
  private initializeModels(): void {
    this.models.set('theft_prediction_v1', {
      name: 'theft_prediction_v1',
      type: 'theft_prediction',
      version: '1.0.0',
      status: 'ready',
      accuracy: 0.85,
    });

    this.models.set('fraud_scoring_v1', {
      name: 'fraud_scoring_v1',
      type: 'fraud_scoring',
      version: '1.0.0',
      status: 'ready',
      accuracy: 0.82,
    });

    this.models.set('movement_prediction_v1', {
      name: 'movement_prediction_v1',
      type: 'movement_prediction',
      version: '1.0.0',
      status: 'ready',
      accuracy: 0.78,
    });

    this.models.set('recovery_success_v1', {
      name: 'recovery_success_v1',
      type: 'recovery_success',
      version: '1.0.0',
      status: 'ready',
      accuracy: 0.75,
    });
  }

  // Predict theft likelihood
  predictTheft(features: Record<string, any>): MLPrediction {
    const model = this.models.get('theft_prediction_v1');
    if (!model || model.status !== 'ready') {
      throw new Error('Theft prediction model not ready');
    }

    // Simplified prediction logic (in production, use actual ML model)
    const riskScore = features.riskScore || 0;
    const movementCount = features.movementCount || 0;
    const simChanges = features.simChanges || 0;

    // Calculate theft likelihood based on features
    let theftLikelihood = 0.3; // Base likelihood

    if (riskScore > 70) theftLikelihood += 0.3;
    if (riskScore > 90) theftLikelihood += 0.2;
    if (movementCount > 50) theftLikelihood += 0.1;
    if (simChanges > 2) theftLikelihood += 0.1;

    theftLikelihood = Math.min(theftLikelihood, 1);

    const prediction: MLPrediction = {
      model: model.name,
      prediction: theftLikelihood,
      confidence: model.accuracy || 0.8,
      features,
      timestamp: new Date(),
    };

    this.predictions.push(prediction);
    this.predictions = this.predictions.slice(-1000); // Keep last 1000

    return prediction;
  }

  // Predict fraud score
  predictFraud(features: Record<string, any>): MLPrediction {
    const model = this.models.get('fraud_scoring_v1');
    if (!model || model.status !== 'ready') {
      throw new Error('Fraud scoring model not ready');
    }

    // Simplified fraud scoring logic
    const riskScore = features.riskScore || 0;
    const simChanges = features.simChanges || 0;
    const deviceAge = features.deviceAge || 0;
    const locationChanges = features.locationChanges || 0;

    let fraudScore = 0.2; // Base score

    if (riskScore > 80) fraudScore += 0.3;
    if (simChanges > 1) fraudScore += 0.2;
    if (deviceAge < 30) fraudScore += 0.1; // New devices are more suspicious
    if (locationChanges > 10) fraudScore += 0.2;

    fraudScore = Math.min(fraudScore, 1);

    const prediction: MLPrediction = {
      model: model.name,
      prediction: fraudScore,
      confidence: model.accuracy || 0.8,
      features,
      timestamp: new Date(),
    };

    this.predictions.push(prediction);
    this.predictions = this.predictions.slice(-1000);

    return prediction;
  }

  // Predict movement
  predictMovement(features: Record<string, any>): MLPrediction {
    const model = this.models.get('movement_prediction_v1');
    if (!model || model.status !== 'ready') {
      throw new Error('Movement prediction model not ready');
    }

    // Simplified movement prediction logic
    const currentLocation = features.currentLocation;
    const knownLocations = features.knownLocations || [];
    const timeOfDay = features.timeOfDay || 12;

    // Predict next location based on known locations and time
    let predictedLocation = currentLocation;
    let confidence = 0.5;

    if (knownLocations.length > 0) {
      // Find most likely location based on time
      const timeBasedLocation = knownLocations.find(loc => 
        loc.typicalHour === timeOfDay
      );

      if (timeBasedLocation) {
        predictedLocation = timeBasedLocation;
        confidence = 0.7;
      }
    }

    const prediction: MLPrediction = {
      model: model.name,
      prediction: confidence,
      confidence: model.accuracy || 0.8,
      features: {
        ...features,
        predictedLocation,
      },
      timestamp: new Date(),
    };

    this.predictions.push(prediction);
    this.predictions = this.predictions.slice(-1000);

    return prediction;
  }

  // Predict recovery success
  predictRecoverySuccess(features: Record<string, any>): MLPrediction {
    const model = this.models.get('recovery_success_v1');
    if (!model || model.status !== 'ready') {
      throw new Error('Recovery success model not ready');
    }

    // Simplified recovery success prediction logic
    const riskScore = features.riskScore || 0;
    const movementPattern = features.movementPattern || 'unknown';
    const knownLocationsCount = features.knownLocationsCount || 0;
    const timeSinceTheft = features.timeSinceTheft || 0;

    let recoveryLikelihood = 0.5; // Base likelihood

    if (riskScore < 50) recoveryLikelihood += 0.2;
    if (movementPattern === 'commute') recoveryLikelihood += 0.15;
    if (knownLocationsCount > 2) recoveryLikelihood += 0.1;
    if (timeSinceTheft < 24) recoveryLikelihood += 0.2; // Better chance if recent
    if (timeSinceTheft > 168) recoveryLikelihood -= 0.2; // Lower chance if > 1 week

    recoveryLikelihood = Math.max(0, Math.min(recoveryLikelihood, 1));

    const prediction: MLPrediction = {
      model: model.name,
      prediction: recoveryLikelihood,
      confidence: model.accuracy || 0.8,
      features,
      timestamp: new Date(),
    };

    this.predictions.push(prediction);
    this.predictions = this.predictions.slice(-1000);

    return prediction;
  }

  // Add training data
  addTrainingData(data: MLTrainingData): void {
    this.trainingData.push(data);
    this.trainingData = this.trainingData.slice(-10000); // Keep last 10000
  }

  // Train model
  async trainModel(modelName: string): Promise<void> {
    const model = this.models.get(modelName);
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }

    model.status = 'training';

    // Simulate training (in production, use actual ML library)
    await new Promise(resolve => setTimeout(resolve, 1000));

    model.status = 'ready';
    model.accuracy = 0.8 + Math.random() * 0.15; // Random accuracy between 0.8 and 0.95
  }

  // Get model
  getModel(modelName: string): MLModel | undefined {
    return this.models.get(modelName);
  }

  // Get all models
  getAllModels(): MLModel[] {
    return Array.from(this.models.values());
  }

  // Get predictions
  getPredictions(modelName?: string, limit = 100): MLPrediction[] {
    const predictions = modelName 
      ? this.predictions.filter(p => p.model === modelName)
      : this.predictions;
    
    return predictions.slice(-limit);
  }

  // Get training data
  getTrainingData(limit = 1000): MLTrainingData[] {
    return this.trainingData.slice(-limit);
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

    this.predictions = this.predictions.filter(p => p.timestamp.getTime() > cutoff);
    this.trainingData = this.trainingData.filter(d => d.timestamp.getTime() > cutoff);
  }
}

// Singleton instance
export const mlPipeline = new MLPipeline();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function predictTheft(features: Record<string, any>): MLPrediction {
  return mlPipeline.predictTheft(features);
}

export function predictFraud(features: Record<string, any>): MLPrediction {
  return mlPipeline.predictFraud(features);
}

export function predictMovement(features: Record<string, any>): MLPrediction {
  return mlPipeline.predictMovement(features);
}

export function predictRecoverySuccess(features: Record<string, any>): MLPrediction {
  return mlPipeline.predictRecoverySuccess(features);
}

export function addTrainingData(data: MLTrainingData): void {
  mlPipeline.addTrainingData(data);
}

export async function trainModel(modelName: string): Promise<void> {
  await mlPipeline.trainModel(modelName);
}

export function getModel(modelName: string): MLModel | undefined {
  return mlPipeline.getModel(modelName);
}

export function getAllModels(): MLModel[] {
  return mlPipeline.getAllModels();
}

export function getPredictions(modelName?: string, limit = 100): MLPrediction[] {
  return mlPipeline.getPredictions(modelName, limit);
}
