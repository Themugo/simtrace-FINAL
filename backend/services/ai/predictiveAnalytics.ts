// services/ai/predictiveAnalytics.ts - Predictive theft risk analysis based on location patterns

export interface LocationData {
  deviceId: string;
  timestamp: number;
  location: { lat: number; lng: number };
  locationType: 'home' | 'work' | 'transit' | 'public' | 'unknown';
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 0-6
}

export interface TheftRiskScore {
  deviceId: string;
  riskScore: number; // 0-1, higher is more risky
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    locationRisk: number;
    timeRisk: number;
    patternRisk: number;
    historicalRisk: number;
  };
  recommendations: string[];
}

class PredictiveAnalyticsService {
  private locationHistory: Map<string, LocationData[]> = new Map();
  private theftIncidents: Map<string, number> = new Map(); // Location hash to incident count
  private readonly HISTORY_WINDOW = 200;
  private readonly RISK_THRESHOLDS = {
    low: 0.3,
    medium: 0.5,
    high: 0.7,
    critical: 0.85
  };

  constructor() {
    console.log('Predictive analytics service initialized');
  }

  public async recordLocation(data: LocationData): Promise<void> {
    const history = this.locationHistory.get(data.deviceId) || [];
    history.push(data);

    if (history.length > this.HISTORY_WINDOW) {
      history.shift();
    }

    this.locationHistory.set(data.deviceId, history);

    // Update theft incident data based on location
    const locationHash = this.hashLocation(data.location);
    const incidentCount = this.theftIncidents.get(locationHash) || 0;
    this.theftIncidents.set(locationHash, incidentCount);
  }

  public async calculateRiskScore(deviceId: string, currentLocation: LocationData): Promise<TheftRiskScore> {
    const history = this.locationHistory.get(deviceId);
    
    // Calculate individual risk factors
    const locationRisk = this.calculateLocationRisk(currentLocation);
    const timeRisk = this.calculateTimeRisk(currentLocation);
    const patternRisk = history ? this.calculatePatternRisk(deviceId, currentLocation) : 0.5;
    const historicalRisk = this.calculateHistoricalRisk(currentLocation);

    // Combine risk factors
    const combinedRisk = (locationRisk * 0.3 + timeRisk * 0.3 + patternRisk * 0.2 + historicalRisk * 0.2);

    const riskLevel = this.getRiskLevel(combinedRisk);
    const recommendations = this.generateRecommendations(combinedRisk, riskLevel, {
      locationRisk,
      timeRisk,
      patternRisk,
      historicalRisk
    });

    return {
      deviceId,
      riskScore: combinedRisk,
      riskLevel,
      confidence: history ? Math.min(history.length / this.HISTORY_WINDOW, 1) : 0.3,
      factors: {
        locationRisk,
        timeRisk,
        patternRisk,
        historicalRisk
      },
      recommendations
    };
  }


  private calculateLocationRisk(location: LocationData): number {
    const locationHash = this.hashLocation(location.location);
    const incidentCount = this.theftIncidents.get(locationHash) || 0;
    
    // Normalize incident count to 0-1 range
    return Math.min(incidentCount / 10, 1);
  }

  private calculateTimeRisk(location: LocationData): number {
    const hour = location.timeOfDay;
    
    // Higher risk during night hours (10 PM - 4 AM)
    if (hour >= 22 || hour <= 4) {
      return 0.8;
    }
    // Medium risk during evening (6 PM - 10 PM)
    if (hour >= 18 && hour < 22) {
      return 0.5;
    }
    // Lower risk during day
    return 0.2;
  }

  private calculatePatternRisk(deviceId: string, currentLocation: LocationData): number {
    const history = this.locationHistory.get(deviceId);
    if (!history || history.length < 5) return 0.5;

    // Check if current location deviates from usual patterns
    const recentLocations = history.slice(-20);
    const avgLat = recentLocations.reduce((sum, d) => sum + d.location.lat, 0) / recentLocations.length;
    const avgLng = recentLocations.reduce((sum, d) => sum + d.location.lng, 0) / recentLocations.length;

    const distance = this.calculateDistance(
      { lat: avgLat, lng: avgLng },
      currentLocation.location
    );

    // Higher risk if far from usual locations
    return Math.min(distance / 10, 1); // 10km threshold
  }

  private calculateHistoricalRisk(location: LocationData): number {
    // Check if this location has historical theft incidents
    const locationHash = this.hashLocation(location.location);
    const incidentCount = this.theftIncidents.get(locationHash) || 0;
    
    return Math.min(incidentCount / 5, 1);
  }

  private getRiskLevel(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= this.RISK_THRESHOLDS.critical) return 'critical';
    if (riskScore >= this.RISK_THRESHOLDS.high) return 'high';
    if (riskScore >= this.RISK_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  private generateRecommendations(
    _riskScore: number,
    riskLevel: string,
    factors: { locationRisk: number; timeRisk: number; patternRisk: number; historicalRisk: number }
  ): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('Immediately activate panic mode');
      recommendations.push('Contact law enforcement');
      recommendations.push('Enable all tracking features');
    } else if (riskLevel === 'high') {
      recommendations.push('Consider activating panic mode');
      recommendations.push('Increase location update frequency');
      recommendations.push('Notify emergency contacts');
    } else if (riskLevel === 'medium') {
      recommendations.push('Stay alert and monitor device');
      recommendations.push('Keep device in secure location');
    }

    if (factors.locationRisk > 0.7) {
      recommendations.push('Avoid this location if possible');
    }

    if (factors.timeRisk > 0.7) {
      recommendations.push('Exercise extra caution at this time');
    }

    if (factors.patternRisk > 0.7) {
      recommendations.push('Unusual location pattern detected');
    }

    return recommendations;
  }

  private hashLocation(location: { lat: number; lng: number }): string {
    // Simple geohash-like function
    const lat = Math.floor(location.lat * 100);
    const lng = Math.floor(location.lng * 100);
    return `${lat},${lng}`;
  }

  private calculateDistance(loc1: { lat: number; lng: number }, loc2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public recordTheftIncident(location: { lat: number; lng: number }): void {
    const locationHash = this.hashLocation(location);
    const incidentCount = this.theftIncidents.get(locationHash) || 0;
    this.theftIncidents.set(locationHash, incidentCount + 1);
  }

  public getLocationHistory(deviceId: string): LocationData[] {
    return this.locationHistory.get(deviceId) || [];
  }

  public clearHistory(deviceId: string): void {
    this.locationHistory.delete(deviceId);
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();

