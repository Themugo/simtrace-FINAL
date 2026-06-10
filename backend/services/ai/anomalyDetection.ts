// services/ai/anomalyDetection.ts - AI-powered anomaly detection for device behavior

export interface DeviceBehaviorData {
  deviceId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  batteryLevel: number;
  networkType: string;
  appUsage: { appId: string; duration: number }[];
  screenTime: number;
  dataUsage: number;
}

export interface AnomalyScore {
  deviceId: string;
  timestamp: number;
  anomalyScore: number; // 0-1, higher is more anomalous
  anomalyType: 'location' | 'usage' | 'network' | 'battery' | 'none';
  confidence: number;
  details: {
    locationAnomaly?: number;
    usageAnomaly?: number;
    networkAnomaly?: number;
    batteryAnomaly?: number;
  };
}

class AnomalyDetectionService {
  private behaviorHistory: Map<string, DeviceBehaviorData[]> = new Map();
  private readonly HISTORY_WINDOW = 100; // Keep last 100 data points
  private readonly ANOMALY_THRESHOLD = 0.7;

  constructor() {
    console.log('Anomaly detection service initialized');
  }

  public async recordBehavior(data: DeviceBehaviorData): Promise<void> {
    const history = this.behaviorHistory.get(data.deviceId) || [];
    history.push(data);

    // Keep only the last N data points
    if (history.length > this.HISTORY_WINDOW) {
      history.shift();
    }

    this.behaviorHistory.set(data.deviceId, history);
  }

  public async detectAnomaly(deviceId: string, currentData: DeviceBehaviorData): Promise<AnomalyScore> {
    const history = this.behaviorHistory.get(deviceId);
    if (!history || history.length < 10) {
      return {
        deviceId,
        timestamp: currentData.timestamp,
        anomalyScore: 0,
        anomalyType: 'none',
        confidence: 0,
        details: {}
      };
    }

    try {
      // Use statistical methods for anomaly detection
      const locationAnomaly = this.detectLocationAnomaly(history, currentData);
      const usageAnomaly = this.detectUsageAnomaly(history, currentData);
      const networkAnomaly = this.detectNetworkAnomaly(history, currentData);
      const batteryAnomaly = this.detectBatteryAnomaly(history, currentData);

      // Calculate overall anomaly score
      const overallScore = (locationAnomaly * 0.3 + usageAnomaly * 0.3 + networkAnomaly * 0.2 + batteryAnomaly * 0.2);

      // Determine anomaly type
      let anomalyType: 'location' | 'usage' | 'network' | 'battery' | 'none' = 'none';
      const maxAnomaly = Math.max(locationAnomaly, usageAnomaly, networkAnomaly, batteryAnomaly);
      
      if (maxAnomaly > this.ANOMALY_THRESHOLD) {
        if (locationAnomaly === maxAnomaly) anomalyType = 'location';
        else if (usageAnomaly === maxAnomaly) anomalyType = 'usage';
        else if (networkAnomaly === maxAnomaly) anomalyType = 'network';
        else if (batteryAnomaly === maxAnomaly) anomalyType = 'battery';
      }

      return {
        deviceId,
        timestamp: currentData.timestamp,
        anomalyScore: overallScore,
        anomalyType,
        confidence: overallScore > this.ANOMALY_THRESHOLD ? overallScore : 0,
        details: {
          locationAnomaly,
          usageAnomaly,
          networkAnomaly,
          batteryAnomaly
        }
      };
    } catch (error) {
      console.error('Error detecting anomaly:', error);
      return {
        deviceId,
        timestamp: currentData.timestamp,
        anomalyScore: 0,
        anomalyType: 'none',
        confidence: 0,
        details: {}
      };
    }
  }

  private detectLocationAnomaly(history: DeviceBehaviorData[], currentData: DeviceBehaviorData): number {
    const recentLocations = history.slice(-20).map(d => d.location);
    const avgLat = recentLocations.reduce((sum, d) => sum + d.lat, 0) / recentLocations.length;
    const avgLng = recentLocations.reduce((sum, d) => sum + d.lng, 0) / recentLocations.length;
    
    const stdLat = Math.sqrt(recentLocations.reduce((sum, d) => sum + Math.pow(d.lat - avgLat, 2), 0) / recentLocations.length);
    const stdLng = Math.sqrt(recentLocations.reduce((sum, d) => sum + Math.pow(d.lng - avgLng, 2), 0) / recentLocations.length);
    
    const zScoreLat = Math.abs(currentData.location.lat - avgLat) / (stdLat || 1);
    const zScoreLng = Math.abs(currentData.location.lng - avgLng) / (stdLng || 1);
    
    return Math.min((zScoreLat + zScoreLng) / 6, 1); // Normalize
  }

  private detectUsageAnomaly(history: DeviceBehaviorData[], currentData: DeviceBehaviorData): number {
    const recentScreenTime = history.slice(-20).map(d => d.screenTime);
    const avgScreenTime = recentScreenTime.reduce((sum, val) => sum + val, 0) / recentScreenTime.length;
    const stdScreenTime = Math.sqrt(recentScreenTime.reduce((sum, val) => sum + Math.pow(val - avgScreenTime, 2), 0) / recentScreenTime.length);
    
    const zScore = Math.abs(currentData.screenTime - avgScreenTime) / (stdScreenTime || 1);
    return Math.min(zScore / 3, 1);
  }

  private detectNetworkAnomaly(history: DeviceBehaviorData[], currentData: DeviceBehaviorData): number {
    const recentDataUsage = history.slice(-20).map(d => d.dataUsage);
    const avgDataUsage = recentDataUsage.reduce((sum, val) => sum + val, 0) / recentDataUsage.length;
    const stdDataUsage = Math.sqrt(recentDataUsage.reduce((sum, val) => sum + Math.pow(val - avgDataUsage, 2), 0) / recentDataUsage.length);
    
    const zScore = Math.abs(currentData.dataUsage - avgDataUsage) / (stdDataUsage || 1);
    return Math.min(zScore / 3, 1);
  }

  private detectBatteryAnomaly(history: DeviceBehaviorData[], currentData: DeviceBehaviorData): number {
    const recentBattery = history.slice(-20).map(d => d.batteryLevel);
    const avgBattery = recentBattery.reduce((sum, val) => sum + val, 0) / recentBattery.length;
    const stdBattery = Math.sqrt(recentBattery.reduce((sum, val) => sum + Math.pow(val - avgBattery, 2), 0) / recentBattery.length);
    
    const zScore = Math.abs(currentData.batteryLevel - avgBattery) / (stdBattery || 1);
    return Math.min(zScore / 3, 1);
  }

  private extractUsageFeatures(data: DeviceBehaviorData): number[] {
    // Extract 10 features from app usage
    const features = new Array(10).fill(0);
    
    // Top 5 apps by duration
    const sortedApps = [...data.appUsage].sort((a, b) => b.duration - a.duration);
    for (let i = 0; i < Math.min(5, sortedApps.length); i++) {
      features[i] = sortedApps[i].duration / data.screenTime;
    }

    // Total screen time normalized
    features[5] = data.screenTime / 1440; // minutes per day

    // Number of apps used
    features[6] = data.appUsage.length / 50;

    // Data usage normalized
    features[7] = data.dataUsage / 1024; // MB

    // App diversity (entropy-like measure)
    const totalDuration = data.appUsage.reduce((sum, app) => sum + app.duration, 0);
    const entropy = data.appUsage.reduce((sum, app) => {
      const p = app.duration / totalDuration;
      return sum - p * Math.log(p);
    }, 0);
    features[8] = entropy / 5;

    // Peak usage time (hour of day)
    features[9] = (new Date(data.timestamp).getHours()) / 24;

    return features;
  }

  private extractNetworkFeatures(data: DeviceBehaviorData): number[] {
    // Extract 3 network features
    return [
      data.networkType === 'wifi' ? 1 : 0,
      data.dataUsage / 1024, // MB
      data.appUsage.length / 50
    ];
  }

  public getBehaviorHistory(deviceId: string): DeviceBehaviorData[] {
    return this.behaviorHistory.get(deviceId) || [];
  }

  public clearHistory(deviceId: string): void {
    this.behaviorHistory.delete(deviceId);
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
