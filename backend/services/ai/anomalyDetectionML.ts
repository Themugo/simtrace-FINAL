// services/ai/anomalyDetectionML.ts - Anomaly detection with ML models
import crypto from 'crypto';

export interface AnomalyModel {
  modelId: string;
  modelName: string;
  modelType: 'isolation_forest' | 'autoencoder' | 'one_class_svm' | 'local_outlier_factor';
  threshold: number;
  accuracy: number;
  lastTrained: number;
  features: string[];
}

export interface AnomalyDetection {
  detectionId: string;
  deviceId: string;
  imei: string;
  anomalyType: 'location' | 'usage' | 'network' | 'behavioral' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  anomalyScore: number;
  description: string;
  detectedAt: number;
  features: any;
  recommendedAction: string;
}

export interface TrainingDataPoint {
  dataId: string;
  deviceId: string;
  features: {
    location: { lat: number; lng: number };
    usage: { appUsage: { [key: string]: number }; screenTime: number };
    network: { bandwidth: number; latency: number; packetLoss: number };
    behavioral: { typingSpeed: number; appSwitching: number; timeOfDay: number };
    security: { loginAttempts: number; failedAuth: number; unusualAccess: number };
  };
  label: 'normal' | 'anomaly';
  timestamp: number;
}

export class AnomalyDetectionMLService {
  private models: Map<string, AnomalyModel> = new Map();
  private detections: Map<string, AnomalyDetection> = new Map();
  private trainingData: Map<string, TrainingDataPoint> = new Map();

  constructor() {
    this.initializeModels();
  }

  /**
   * Initialize anomaly detection models
   */
  private initializeModels(): void {
    const models: AnomalyModel[] = [
      {
        modelId: 'isolation_forest_location',
        modelName: 'Isolation Forest - Location',
        modelType: 'isolation_forest',
        threshold: 0.7,
        accuracy: 0.91,
        lastTrained: Date.now() - 86400000 * 7,
        features: ['location', 'time_patterns', 'travel_distance']
      },
      {
        modelId: 'autoencoder_usage',
        modelName: 'Autoencoder - Usage',
        modelType: 'autoencoder',
        threshold: 0.75,
        accuracy: 0.88,
        lastTrained: Date.now() - 86400000 * 5,
        features: ['app_usage', 'screen_time', 'app_switching']
      },
      {
        modelId: 'one_class_svm_network',
        modelName: 'One-Class SVM - Network',
        modelType: 'one_class_svm',
        threshold: 0.8,
        accuracy: 0.93,
        lastTrained: Date.now() - 86400000 * 3,
        features: ['bandwidth', 'latency', 'packet_loss', 'connection_stability']
      },
      {
        modelId: 'lof_behavioral',
        modelName: 'Local Outlier Factor - Behavioral',
        modelType: 'local_outlier_factor',
        threshold: 0.65,
        accuracy: 0.86,
        lastTrained: Date.now() - 86400000 * 10,
        features: ['typing_speed', 'app_switching', 'time_of_day', 'interaction_patterns']
      }
    ];

    for (const model of models) {
      this.models.set(model.modelId, model);
    }
  }

  /**
   * Detect anomalies in device behavior
   */
  async detectAnomalies(
    deviceId: string,
    imei: string,
    features: {
      location?: { lat: number; lng: number };
      usage?: { appUsage: { [key: string]: number }; screenTime: number };
      network?: { bandwidth: number; latency: number; packetLoss: number };
      behavioral?: { typingSpeed: number; appSwitching: number; timeOfDay: number };
      security?: { loginAttempts: number; failedAuth: number; unusualAccess: number };
    }
  ): Promise<AnomalyDetection[]> {
    const detections: AnomalyDetection[] = [];

    // Detect location anomalies
    if (features.location) {
      const locationAnomaly = await this.detectLocationAnomaly(deviceId, imei, features.location);
      if (locationAnomaly) detections.push(locationAnomaly);
    }

    // Detect usage anomalies
    if (features.usage) {
      const usageAnomaly = await this.detectUsageAnomaly(deviceId, imei, features.usage);
      if (usageAnomaly) detections.push(usageAnomaly);
    }

    // Detect network anomalies
    if (features.network) {
      const networkAnomaly = await this.detectNetworkAnomaly(deviceId, imei, features.network);
      if (networkAnomaly) detections.push(networkAnomaly);
    }

    // Detect behavioral anomalies
    if (features.behavioral) {
      const behavioralAnomaly = await this.detectBehavioralAnomaly(deviceId, imei, features.behavioral);
      if (behavioralAnomaly) detections.push(behavioralAnomaly);
    }

    // Detect security anomalies
    if (features.security) {
      const securityAnomaly = await this.detectSecurityAnomaly(deviceId, imei, features.security);
      if (securityAnomaly) detections.push(securityAnomaly);
    }

    // Store detections
    for (const detection of detections) {
      this.detections.set(detection.detectionId, detection);
    }

    return detections.sort((a, b) => b.anomalyScore - a.anomalyScore);
  }

  /**
   * Detect location anomaly
   */
  private async detectLocationAnomaly(
    deviceId: string,
    imei: string,
    location: { lat: number; lng: number }
  ): Promise<AnomalyDetection | null> {
    const model = this.models.get('isolation_forest_location');
    
    if (!model) {
      return null;
    }

    // Get historical location data
    const historicalData = this.getHistoricalLocationData(deviceId);
    
    if (historicalData.length < 5) {
      return null; // Not enough data
    }

    // Calculate anomaly score
    const anomalyScore = this.calculateLocationAnomalyScore(location, historicalData);
    
    if (anomalyScore > model.threshold) {
      const severity = this.mapScoreToSeverity(anomalyScore);
      
      return {
        detectionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        anomalyType: 'location',
        severity,
        confidence: model.accuracy,
        anomalyScore,
        description: `Unusual location detected. Device is ${anomalyScore.toFixed(2)} km from usual area.`,
        detectedAt: Date.now(),
        features: { location },
        recommendedAction: severity === 'critical' ? 'Immediate investigation required' : 'Monitor location closely'
      };
    }

    return null;
  }

  /**
   * Detect usage anomaly
   */
  private async detectUsageAnomaly(
    deviceId: string,
    imei: string,
    usage: { appUsage: { [key: string]: number }; screenTime: number }
  ): Promise<AnomalyDetection | null> {
    const model = this.models.get('autoencoder_usage');
    
    if (!model) {
      return null;
    }

    const historicalData = this.getHistoricalUsageData(deviceId);
    
    if (historicalData.length < 5) {
      return null;
    }

    const anomalyScore = this.calculateUsageAnomalyScore(usage, historicalData);
    
    if (anomalyScore > model.threshold) {
      const severity = this.mapScoreToSeverity(anomalyScore);
      
      return {
        detectionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        anomalyType: 'usage',
        severity,
        confidence: model.accuracy,
        anomalyScore,
        description: `Unusual usage pattern detected. Screen time deviation: ${anomalyScore.toFixed(2)}`,
        detectedAt: Date.now(),
        features: { usage },
        recommendedAction: 'Review app usage and screen time patterns'
      };
    }

    return null;
  }

  /**
   * Detect network anomaly
   */
  private async detectNetworkAnomaly(
    deviceId: string,
    imei: string,
    network: { bandwidth: number; latency: number; packetLoss: number }
  ): Promise<AnomalyDetection | null> {
    const model = this.models.get('one_class_svm_network');
    
    if (!model) {
      return null;
    }

    const historicalData = this.getHistoricalNetworkData(deviceId);
    
    if (historicalData.length < 5) {
      return null;
    }

    const anomalyScore = this.calculateNetworkAnomalyScore(network, historicalData);
    
    if (anomalyScore > model.threshold) {
      const severity = this.mapScoreToSeverity(anomalyScore);
      
      return {
        detectionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        anomalyType: 'network',
        severity,
        confidence: model.accuracy,
        anomalyScore,
        description: `Network anomaly detected. Latency: ${network.latency}ms, Packet loss: ${network.packetLoss}%`,
        detectedAt: Date.now(),
        features: { network },
        recommendedAction: severity === 'critical' ? 'Investigate network connection immediately' : 'Monitor network stability'
      };
    }

    return null;
  }

  /**
   * Detect behavioral anomaly
   */
  private async detectBehavioralAnomaly(
    deviceId: string,
    imei: string,
    behavioral: { typingSpeed: number; appSwitching: number; timeOfDay: number }
  ): Promise<AnomalyDetection | null> {
    const model = this.models.get('lof_behavioral');
    
    if (!model) {
      return null;
    }

    const historicalData = this.getHistoricalBehavioralData(deviceId);
    
    if (historicalData.length < 5) {
      return null;
    }

    const anomalyScore = this.calculateBehavioralAnomalyScore(behavioral, historicalData);
    
    if (anomalyScore > model.threshold) {
      const severity = this.mapScoreToSeverity(anomalyScore);
      
      return {
        detectionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        anomalyType: 'behavioral',
        severity,
        confidence: model.accuracy,
        anomalyScore,
        description: `Behavioral anomaly detected. Unusual typing speed or app switching pattern.`,
        detectedAt: Date.now(),
        features: { behavioral },
        recommendedAction: 'Verify user identity and monitor account activity'
      };
    }

    return null;
  }

  /**
   * Detect security anomaly
   */
  private async detectSecurityAnomaly(
    deviceId: string,
    imei: string,
    security: { loginAttempts: number; failedAuth: number; unusualAccess: number }
  ): Promise<AnomalyDetection | null> {
    // Security anomalies use simple threshold-based detection
    const anomalyScore = (security.failedAuth * 0.4) + (security.unusualAccess * 0.3) + (security.loginAttempts * 0.3);
    
    if (anomalyScore > 0.7) {
      const severity = this.mapScoreToSeverity(anomalyScore);
      
      return {
        detectionId: crypto.randomBytes(16).toString('hex'),
        deviceId,
        imei,
        anomalyType: 'security',
        severity,
        confidence: 0.95,
        anomalyScore,
        description: `Security anomaly detected. Failed auth: ${security.failedAuth}, Unusual access: ${security.unusualAccess}`,
        detectedAt: Date.now(),
        features: { security },
        recommendedAction: severity === 'critical' ? 'Lock account and investigate immediately' : 'Enable additional security measures'
      };
    }

    return null;
  }

  /**
   * Get historical location data (simulated)
   */
  private getHistoricalLocationData(_deviceId: string): { lat: number; lng: number }[] {
    // In production, this would fetch from database
    const data: { lat: number; lng: number }[] = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1
      });
    }
    return data;
  }

  /**
   * Get historical usage data (simulated)
   */
  private getHistoricalUsageData(_deviceId: string): any[] {
    const data: any[] = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        appUsage: { 'app1': Math.random() * 100, 'app2': Math.random() * 100 },
        screenTime: Math.random() * 480
      });
    }
    return data;
  }

  /**
   * Get historical network data (simulated)
   */
  private getHistoricalNetworkData(_deviceId: string): any[] {
    const data: any[] = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        bandwidth: 10 + Math.random() * 90,
        latency: 20 + Math.random() * 80,
        packetLoss: Math.random() * 5
      });
    }
    return data;
  }

  /**
   * Get historical behavioral data (simulated)
   */
  private getHistoricalBehavioralData(_deviceId: string): any[] {
    const data: any[] = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        typingSpeed: 50 + Math.random() * 100,
        appSwitching: Math.random() * 20,
        timeOfDay: Math.floor(Math.random() * 24)
      });
    }
    return data;
  }

  /**
   * Calculate location anomaly score
   */
  private calculateLocationAnomalyScore(location: { lat: number; lng: number }, historicalData: { lat: number; lng: number }[]): number {
    let totalDistance = 0;
    for (const historical of historicalData) {
      totalDistance += this.calculateDistance(location, historical);
    }
    const avgDistance = totalDistance / historicalData.length;
    return Math.min(avgDistance / 50, 1); // Normalize
  }

  /**
   * Calculate usage anomaly score
   */
  private calculateUsageAnomalyScore(usage: any, historicalData: any[]): number {
    const historicalScreenTimes = historicalData.map(d => d.screenTime);
    const avgScreenTime = historicalScreenTimes.reduce((sum, t) => sum + t, 0) / historicalScreenTimes.length;
    
    const deviation = Math.abs(usage.screenTime - avgScreenTime) / avgScreenTime;
    return Math.min(deviation, 1);
  }

  /**
   * Calculate network anomaly score
   */
  private calculateNetworkAnomalyScore(network: any, historicalData: any[]): number {
    const historicalLatencies = historicalData.map(d => d.latency);
    const avgLatency = historicalLatencies.reduce((sum, l) => sum + l, 0) / historicalLatencies.length;
    
    const latencyDeviation = Math.abs(network.latency - avgLatency) / avgLatency;
    const packetLossScore = network.packetLoss / 10;
    
    return Math.min((latencyDeviation + packetLossScore) / 2, 1);
  }

  /**
   * Calculate behavioral anomaly score
   */
  private calculateBehavioralAnomalyScore(behavioral: any, historicalData: any[]): number {
    const historicalTypingSpeeds = historicalData.map(d => d.typingSpeed);
    const avgTypingSpeed = historicalTypingSpeeds.reduce((sum, t) => sum + t, 0) / historicalTypingSpeeds.length;
    
    const typingDeviation = Math.abs(behavioral.typingSpeed - avgTypingSpeed) / avgTypingSpeed;
    const appSwitchingScore = behavioral.appSwitching / 30;
    
    return Math.min((typingDeviation + appSwitchingScore) / 2, 1);
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
   * Map score to severity
   */
  private mapScoreToSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 0.6) return 'low';
    if (score < 0.7) return 'medium';
    if (score < 0.85) return 'high';
    return 'critical';
  }

  /**
   * Add training data
   */
  addTrainingData(data: TrainingDataPoint): void {
    const dataId = crypto.randomBytes(16).toString('hex');
    this.trainingData.set(dataId, data);
  }

  /**
   * Retrain model
   */
  async retrainModel(modelId: string): Promise<AnomalyModel> {
    const model = this.models.get(modelId);
    
    if (!model) {
      throw new Error('Model not found');
    }

    // Simulate training
    await new Promise(resolve => setTimeout(resolve, 2000));

    model.accuracy = Math.min(0.99, model.accuracy + 0.01);
    model.lastTrained = Date.now();
    this.models.set(modelId, model);

    return model;
  }

  /**
   * Get detection history for device
   */
  getDetectionHistory(deviceId: string, limit: number = 100): AnomalyDetection[] {
    return Array.from(this.detections.values())
      .filter(d => d.deviceId === deviceId)
      .sort((a, b) => b.detectedAt - a.detectedAt)
      .slice(0, limit);
  }

  /**
   * Get model information
   */
  getModel(modelId: string): AnomalyModel | null {
    return this.models.get(modelId) || null;
  }

  /**
   * Get all models
   */
  getAllModels(): AnomalyModel[] {
    return Array.from(this.models.values());
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalModels: number;
    totalDetections: number;
    totalTrainingData: number;
    averageAccuracy: number;
    detectionsByType: { [key: string]: number };
    detectionsBySeverity: { [key: string]: number };
  } {
    const models = Array.from(this.models.values());
    const detections = Array.from(this.detections.values());

    const detectionsByType: { [key: string]: number } = {};
    const detectionsBySeverity: { [key: string]: number } = {};

    for (const detection of detections) {
      detectionsByType[detection.anomalyType] = (detectionsByType[detection.anomalyType] || 0) + 1;
      detectionsBySeverity[detection.severity] = (detectionsBySeverity[detection.severity] || 0) + 1;
    }

    const averageAccuracy = models.length > 0
      ? models.reduce((sum, m) => sum + m.accuracy, 0) / models.length
      : 0;

    return {
      totalModels: models.length,
      totalDetections: detections.length,
      totalTrainingData: this.trainingData.size,
      averageAccuracy,
      detectionsByType,
      detectionsBySeverity
    };
  }

  /**
   * Clear old detections
   */
  clearOldDetections(maxAge: number = 2592000000): number {
    const now = Date.now();
    let cleared = 0;

    for (const [detectionId, detection] of this.detections.entries()) {
      if (now - detection.detectedAt > maxAge) {
        this.detections.delete(detectionId);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Export detections
   */
  exportDetections(deviceId?: string): string {
    const detections = deviceId
      ? Array.from(this.detections.values()).filter(d => d.deviceId === deviceId)
      : Array.from(this.detections.values());
    
    return JSON.stringify(detections, null, 2);
  }

  /**
   * Import training data
   */
  importTrainingData(data: TrainingDataPoint[]): number {
    let imported = 0;

    for (const item of data) {
      const dataId = crypto.randomBytes(16).toString('hex');
      this.trainingData.set(dataId, item);
      imported++;
    }

    return imported;
  }
}

export const anomalyDetectionMLService = new AnomalyDetectionMLService();
