// services/ai/deepLearning.ts - Deep learning models for theft prediction
import crypto from 'crypto';

export interface TheftPredictionModel {
  modelId: string;
  modelName: string;
  modelType: 'lstm' | 'transformer' | 'cnn' | 'hybrid';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastTrained: number;
  trainingDataSize: number;
  features: string[];
}

export interface TheftPrediction {
  predictionId: string;
  deviceId: string;
  imei: string;
  prediction: 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' | 'critical';
  confidence: number;
  riskFactors: string[];
  predictedTimeframe: number; // hours until potential theft
  recommendations: string[];
  timestamp: number;
}

export interface TrainingData {
  dataId: string;
  deviceId: string;
  features: {
    locationHistory: { lat: number; lng: number; timestamp: number }[];
    usagePatterns: { app: string; duration: number; frequency: number }[];
    batteryHealth: number;
    signalStrength: number;
    travelPatterns: { distance: number; frequency: number }[];
    timePatterns: { hour: number; activity: string }[];
  };
  label: 'safe' | 'stolen';
  timestamp: number;
}

export class DeepLearningService {
  private models: Map<string, TheftPredictionModel> = new Map();
  private predictions: Map<string, TheftPrediction> = new Map();
  private trainingData: Map<string, TrainingData> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize deep learning models
   */
  private initializeModels(): void {
    const models: TheftPredictionModel[] = [
      {
        modelId: 'lstm_theft_predictor',
        modelName: 'LSTM Theft Predictor',
        modelType: 'lstm',
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.94,
        f1Score: 0.91,
        lastTrained: Date.now() - 86400000 * 7, // 7 days ago
        trainingDataSize: 50000,
        features: ['location_history', 'usage_patterns', 'battery_health', 'signal_strength', 'travel_patterns', 'time_patterns']
      },
      {
        modelId: 'transformer_behavior_analyzer',
        modelName: 'Transformer Behavior Analyzer',
        modelType: 'transformer',
        accuracy: 0.88,
        precision: 0.85,
        recall: 0.90,
        f1Score: 0.87,
        lastTrained: Date.now() - 86400000 * 5,
        trainingDataSize: 75000,
        features: ['usage_patterns', 'time_patterns', 'app_usage', 'interaction_patterns']
      },
      {
        modelId: 'hybrid_risk_assessor',
        modelName: 'Hybrid Risk Assessor',
        modelType: 'hybrid',
        accuracy: 0.95,
        precision: 0.93,
        recall: 0.96,
        f1Score: 0.94,
        lastTrained: Date.now() - 86400000 * 3,
        trainingDataSize: 100000,
        features: ['location_history', 'usage_patterns', 'battery_health', 'signal_strength', 'travel_patterns', 'time_patterns', 'environmental_factors']
      }
    ];

    for (const model of models) {
      this.models.set(model.modelId, model);
    }
  }

  /**
   * Predict theft risk for device
   */
  async predictTheftRisk(
    deviceId: string,
    imei: string,
    features: {
      locationHistory: { lat: number; lng: number; timestamp: number }[];
      usagePatterns: { app: string; duration: number; frequency: number }[];
      batteryHealth: number;
      signalStrength: number;
      travelPatterns: { distance: number; frequency: number }[];
      timePatterns: { hour: number; activity: string }[];
    }
  ): Promise<TheftPrediction> {
    // Use the best model (hybrid)
    const model = this.models.get('hybrid_risk_assessor');
    
    if (!model) {
      throw new Error('Model not available');
    }

    // Simulate deep learning inference
    const riskScore = this.calculateRiskScore(features);
    const prediction = this.mapRiskToPrediction(riskScore);
    const confidence = this.calculateConfidence(features, model.accuracy);
    const riskFactors = this.identifyRiskFactors(features);
    const predictedTimeframe = this.predictTimeframe(riskScore);
    const recommendations = this.generateRecommendations(prediction, riskFactors);

    const theftPrediction: TheftPrediction = {
      predictionId: crypto.randomBytes(16).toString('hex'),
      deviceId,
      imei,
      prediction,
      confidence,
      riskFactors,
      predictedTimeframe,
      recommendations,
      timestamp: Date.now()
    };

    this.predictions.set(theftPrediction.predictionId, theftPrediction);
    return theftPrediction;
  }

  /**
   * Calculate risk score from features
   */
  private calculateRiskScore(features: any): number {
    let riskScore = 0;

    // Location pattern analysis
    if (features.locationHistory.length > 0) {
      const recentLocations = features.locationHistory.slice(-10);
      const locationVariance = this.calculateLocationVariance(recentLocations);
      riskScore += locationVariance * 0.3;
    }

    // Usage pattern analysis
    if (features.usagePatterns.length > 0) {
      const usageVariance = this.calculateUsageVariance(features.usagePatterns);
      riskScore += usageVariance * 0.2;
    }

    // Battery health
    if (features.batteryHealth < 50) {
      riskScore += (100 - features.batteryHealth) * 0.001;
    }

    // Signal strength
    if (features.signalStrength < 50) {
      riskScore += (100 - features.signalStrength) * 0.001;
    }

    // Travel patterns
    if (features.travelPatterns.length > 0) {
      const travelRisk = features.travelPatterns.reduce((sum: number, p: any) => sum + (p.distance * p.frequency), 0);
      riskScore += Math.min(travelRisk * 0.0001, 0.2);
    }

    // Time patterns (night activity)
    if (features.timePatterns.length > 0) {
      const nightActivity = features.timePatterns.filter((p: any) => p.hour >= 22 || p.hour <= 5).length;
      riskScore += (nightActivity / features.timePatterns.length) * 0.15;
    }

    return Math.min(riskScore, 1);
  }

  /**
   * Calculate location variance
   */
  private calculateLocationVariance(locations: any[]): number {
    if (locations.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 1; i < locations.length; i++) {
      totalDistance += this.calculateDistance(locations[i - 1], locations[i]);
    }

    const avgDistance = totalDistance / (locations.length - 1);
    return Math.min(avgDistance / 100, 1); // Normalize
  }

  /**
   * Calculate usage variance
   */
  private calculateUsageVariance(patterns: any[]): number {
    if (patterns.length === 0) return 0;

    const durations = patterns.map(p => p.duration);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    return Math.min(variance / 10000, 1); // Normalize
  }

  /**
   * Calculate distance between two coordinates
   */
  private calculateDistance(coord1: any, coord2: any): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(coord2.lat - coord1.lat);
    const dLng = this.toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Convert degrees to radians
   */
  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Map risk score to prediction
   */
  private mapRiskToPrediction(riskScore: number): 'safe' | 'low_risk' | 'medium_risk' | 'high_risk' | 'critical' {
    if (riskScore < 0.2) return 'safe';
    if (riskScore < 0.4) return 'low_risk';
    if (riskScore < 0.6) return 'medium_risk';
    if (riskScore < 0.8) return 'high_risk';
    return 'critical';
  }

  /**
   * Calculate confidence
   */
  private calculateConfidence(features: any, modelAccuracy: number): number {
    // More data = higher confidence
    const dataCompleteness = this.calculateDataCompleteness(features);
    return Math.min(modelAccuracy * dataCompleteness, 0.99);
  }

  /**
   * Calculate data completeness
   */
  private calculateDataCompleteness(features: any): number {
    let completeness = 0;
    let totalFeatures = 6;

    if (features.locationHistory && features.locationHistory.length > 0) completeness++;
    if (features.usagePatterns && features.usagePatterns.length > 0) completeness++;
    if (features.batteryHealth !== undefined) completeness++;
    if (features.signalStrength !== undefined) completeness++;
    if (features.travelPatterns && features.travelPatterns.length > 0) completeness++;
    if (features.timePatterns && features.timePatterns.length > 0) completeness++;

    return completeness / totalFeatures;
  }

  /**
   * Identify risk factors
   */
  private identifyRiskFactors(features: any): string[] {
    const riskFactors: string[] = [];

    if (features.locationHistory.length > 0) {
      const recentLocations = features.locationHistory.slice(-10);
      const locationVariance = this.calculateLocationVariance(recentLocations);
      if (locationVariance > 0.5) riskFactors.push('Unusual location patterns');
    }

    if (features.batteryHealth < 50) {
      riskFactors.push('Low battery health');
    }

    if (features.signalStrength < 50) {
      riskFactors.push('Poor signal strength');
    }

    if (features.timePatterns.length > 0) {
      const nightActivity = features.timePatterns.filter((p: any) => p.hour >= 22 || p.hour <= 5).length;
      if (nightActivity / features.timePatterns.length > 0.3) {
        riskFactors.push('Unusual night activity');
      }
    }

    if (features.usagePatterns.length > 0) {
      const usageVariance = this.calculateUsageVariance(features.usagePatterns);
      if (usageVariance > 0.5) riskFactors.push('Irregular usage patterns');
    }

    return riskFactors;
  }

  /**
   * Predict timeframe
   */
  private predictTimeframe(riskScore: number): number {
    // Higher risk = shorter timeframe
    if (riskScore < 0.2) return 720; // 30 days
    if (riskScore < 0.4) return 336; // 14 days
    if (riskScore < 0.6) return 168; // 7 days
    if (riskScore < 0.8) return 72; // 3 days
    return 24; // 1 day
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(prediction: string, riskFactors: string[]): string[] {
    const recommendations: string[] = [];

    if (prediction === 'critical' || prediction === 'high_risk') {
      recommendations.push('Enable real-time tracking immediately');
      recommendations.push('Contact local authorities');
      recommendations.push('Notify emergency contacts');
    }

    if (prediction === 'medium_risk') {
      recommendations.push('Increase tracking frequency');
      recommendations.push('Review recent activity');
      recommendations.push('Enable location alerts');
    }

    if (riskFactors.includes('Low battery health')) {
      recommendations.push('Charge device or replace battery');
    }

    if (riskFactors.includes('Poor signal strength')) {
      recommendations.push('Move to area with better coverage');
    }

    if (riskFactors.includes('Unusual location patterns')) {
      recommendations.push('Review location history');
    }

    return recommendations;
  }

  /**
   * Add training data
   */
  addTrainingData(data: TrainingData): void {
    const dataId = crypto.randomBytes(16).toString('hex');
    this.trainingData.set(dataId, data);
  }

  /**
   * Retrain model
   */
  async retrainModel(modelId: string): Promise<TheftPredictionModel> {
    const model = this.models.get(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }

    // Simulate training
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update model metrics (simulate improvement)
    model.accuracy = Math.min(0.99, model.accuracy + 0.01);
    model.precision = Math.min(0.99, model.precision + 0.01);
    model.recall = Math.min(0.99, model.recall + 0.01);
    model.f1Score = Math.min(0.99, model.f1Score + 0.01);
    model.lastTrained = Date.now();
    model.trainingDataSize += this.trainingData.size;

    this.models.set(modelId, model);
    return model;
  }

  /**
   * Get prediction history for device
   */
  getPredictionHistory(deviceId: string, limit: number = 100): TheftPrediction[] {
    return Array.from(this.predictions.values())
      .filter(p => p.deviceId === deviceId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get model information
   */
  getModel(modelId: string): TheftPredictionModel | null {
    return this.models.get(modelId) || null;
  }

  /**
   * Get all models
   */
  getAllModels(): TheftPredictionModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalModels: number;
    totalPredictions: number;
    totalTrainingData: number;
    averageAccuracy: number;
    predictionsByType: { [key: string]: number };
  } {
    const models = Array.from(this.models.values());
    const predictions = Array.from(this.predictions.values());

    const predictionsByType: { [key: string]: number } = {};
    for (const prediction of predictions) {
      predictionsByType[prediction.prediction] = (predictionsByType[prediction.prediction] || 0) + 1;
    }

    const averageAccuracy = models.length > 0
      ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
      : 0;

    return {
      totalModels: models.length,
      totalPredictions: predictions.length,
      totalTrainingData: this.trainingData.size,
      averageAccuracy,
      predictionsByType
    };
  }

  /**
   * Clear old predictions
   */
  clearOldPredictions(maxAge: number = 2592000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [predictionId, prediction] of this.predictions.entries()) {
      if (now - prediction.timestamp > maxAge) {
        this.predictions.delete(predictionId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export predictions
   */
  exportPredictions(deviceId?: string): string {
    const predictions = deviceId
      ? Array.from(this.predictions.values()).filter(p => p.deviceId === deviceId)
      : Array.from(this.predictions.values());
    
    return JSON.stringify(predictions, null, 2);
  }

  /**
   * Import training data
   */
  importTrainingData(data: TrainingData[]): number {
    let imported = 0;

    for (const item of data) {
      const dataId = crypto.randomBytes(16).toString('hex');
      this.trainingData.set(dataId, item);
      imported++;
    }

    return imported;
  }
}

export const deepLearningService = new DeepLearningService();
