// ── Digital Twin Device Model ───────────────────────────────────────────────────────
// Persistent device profiles for predictive AI and anomaly detection

import { DeviceLocation, TrackingEvent } from '../../db/index.js';

export interface DeviceDigitalTwin {
  imei: string;
  riskHistory: RiskHistoryEntry[];
  movementPatterns: MovementPattern[];
  knownLocations: KnownLocation[];
  behaviorProfile: BehaviorProfile;
  recoveryLikelihood: number;
  lastUpdated: Date;
}

export interface RiskHistoryEntry {
  timestamp: Date;
  riskScore: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
}

export interface MovementPattern {
  patternType: 'commute' | 'random' | 'stationary' | 'travel';
  typicalLocations: Array<{ lat: number; lng: number; frequency: number }>;
  typicalTimes: Array<{ hour: number; frequency: number }>;
  averageSpeed: number;
  confidence: number;
}

export interface KnownLocation {
  lat: number;
  lng: number;
  name?: string;
  type: 'home' | 'work' | 'frequent' | 'transit';
  visitCount: number;
  firstSeen: Date;
  lastSeen: Date;
  avgStayDuration: number;
}

export interface BehaviorProfile {
  activityLevel: 'low' | 'medium' | 'high';
  typicalDayStart: number; // hour
  typicalDayEnd: number; // hour
  mobilityScore: number;
  predictabilityScore: number;
  anomalyCount: number;
}

class DigitalTwinManager {
  private cache: Map<string, DeviceDigitalTwin> = new Map();
  private cacheTTL = 3600000; // 1 hour

  // Get or create digital twin for device
  async getDigitalTwin(imei: string): Promise<DeviceDigitalTwin> {
    // Check cache first
    const cached = this.cache.get(imei);
    if (cached && Date.now() - cached.lastUpdated.getTime() < this.cacheTTL) {
      return cached;
    }

    // Build digital twin from data
    const twin = await this.buildDigitalTwin(imei);
    
    // Cache it
    this.cache.set(imei, twin);
    
    return twin;
  }

  // Build digital twin from historical data
  private async buildDigitalTwin(imei: string): Promise<DeviceDigitalTwin> {
    // Get historical data
    const riskHistory = await this.buildRiskHistory(imei);
    const movementPatterns = await this.buildMovementPatterns(imei);
    const knownLocations = await this.buildKnownLocations(imei);
    const behaviorProfile = await this.buildBehaviorProfile(imei, movementPatterns, knownLocations);
    const recoveryLikelihood = await this.calculateRecoveryLikelihood(imei, riskHistory, behaviorProfile);

    return {
      imei,
      riskHistory,
      movementPatterns,
      knownLocations,
      behaviorProfile,
      recoveryLikelihood,
      lastUpdated: new Date(),
    };
  }

  // Build risk history
  private async buildRiskHistory(imei: string): Promise<RiskHistoryEntry[]> {
    const events = await TrackingEvent.find({ imei })
      .sort({ timestamp: -1 })
      .limit(100);

    return events
      .filter(e => e.riskScore !== undefined)
      .map(e => ({
        timestamp: e.timestamp,
        riskScore: e.riskScore || 0,
        threatLevel: e.threatLevel || 'LOW',
        riskFactors: [],
      }));
  }

  // Build movement patterns
  private async buildMovementPatterns(imei: string): Promise<MovementPattern[]> {
    const locations = await DeviceLocation.find({ imei })
      .sort({ timestamp: -1 })
      .limit(500);

    if (locations.length < 10) {
      return [];
    }

    const patterns: MovementPattern[] = [];

    // Analyze movement patterns
    const patternType = this.detectMovementPatternType(locations);
    const typicalLocations = this.extractTypicalLocations(locations);
    const typicalTimes = this.extractTypicalTimes(locations);
    const averageSpeed = this.calculateAverageSpeed(locations);
    const confidence = this.calculatePatternConfidence(locations);

    patterns.push({
      patternType,
      typicalLocations,
      typicalTimes,
      averageSpeed,
      confidence,
    });

    return patterns;
  }

  // Detect movement pattern type
  private detectMovementPatternType(locations: any[]): 'commute' | 'random' | 'stationary' | 'travel' {
    if (locations.length < 2) return 'stationary';

    const distances = [];
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i];
      const curr = locations[i - 1];
      const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      distances.push(distance);
    }

    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const maxDistance = Math.max(...distances);

    if (avgDistance < 0.1) return 'stationary';
    if (maxDistance > 50) return 'travel';
    if (this.isCommutePattern(locations)) return 'commute';
    return 'random';
  }

  private isCommutePattern(locations: any[]): boolean {
    // Check for regular movement between 2-3 locations
    const uniqueLocations = new Set(locations.map(l => `${l.lat.toFixed(4)},${l.lng.toFixed(4)}`));
    return uniqueLocations.size >= 2 && uniqueLocations.size <= 4;
  }

  // Extract typical locations
  private extractTypicalLocations(locations: any[]): Array<{ lat: number; lng: number; frequency: number }> {
    const locationCounts = new Map<string, { lat: number; lng: number; count: number }>();

    for (const loc of locations) {
      const key = `${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`;
      const existing = locationCounts.get(key);
      if (existing) {
        existing.count++;
      } else {
        locationCounts.set(key, { lat: loc.lat, lng: loc.lng, count: 1 });
      }
    }

    const total = locations.length;
    return Array.from(locationCounts.values())
      .map(loc => ({
        lat: loc.lat,
        lng: loc.lng,
        frequency: loc.count / total,
      }))
      .filter(loc => loc.frequency > 0.05) // Only locations visited >5% of time
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  // Extract typical times
  private extractTypicalTimes(locations: any[]): Array<{ hour: number; frequency: number }> {
    const hourCounts = new Map<number, number>();

    for (const loc of locations) {
      const hour = new Date(loc.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const total = locations.length;
    return Array.from(hourCounts.entries())
      .map(([hour, count]) => ({
        hour,
        frequency: count / total,
      }))
      .sort((a, b) => b.frequency - a.frequency);
  }

  // Calculate average speed
  private calculateAverageSpeed(locations: any[]): number {
    if (locations.length < 2) return 0;

    let totalSpeed = 0;
    let count = 0;

    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i];
      const curr = locations[i - 1];
      const distance = this.haversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
      const timeDiff = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();
      
      if (timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600000); // km/h
        if (speed < 200) { // Filter out impossible speeds
          totalSpeed += speed;
          count++;
        }
      }
    }

    return count > 0 ? totalSpeed / count : 0;
  }

  // Calculate pattern confidence
  private calculatePatternConfidence(locations: any[]): number {
    if (locations.length < 10) return 0;

    const typicalLocations = this.extractTypicalLocations(locations);
    const topLocationFreq = typicalLocations[0]?.frequency || 0;

    return Math.min(topLocationFreq * 2, 1);
  }

  // Build known locations
  private async buildKnownLocations(imei: string): Promise<KnownLocation[]> {
    const locations = await DeviceLocation.find({ imei })
      .sort({ timestamp: -1 })
      .limit(500);

    if (locations.length < 5) return [];

    // Cluster locations
    const clusters = this.clusterLocations(locations);

    // Convert clusters to known locations
    const knownLocations: KnownLocation[] = clusters.map(cluster => {
      const type = this.classifyLocation(cluster);
      const name = this.generateLocationName(cluster, type);

      return {
        lat: cluster.center.lat,
        lng: cluster.center.lng,
        name,
        type,
        visitCount: cluster.count,
        firstSeen: cluster.firstSeen,
        lastSeen: cluster.lastSeen,
        avgStayDuration: cluster.avgStayDuration,
      };
    });

    return knownLocations.sort((a, b) => b.visitCount - a.visitCount);
  }

  // Cluster locations
  private clusterLocations(locations: any[]): Array<{
    center: { lat: number; lng: number };
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    avgStayDuration: number;
  }> {
    const clusters: Map<string, any> = new Map();
    const threshold = 0.001; // ~100m

    for (const loc of locations) {
      let foundCluster = false;

      for (const [key, cluster] of clusters) {
        const distance = this.haversineDistance(
          cluster.center.lat,
          cluster.center.lng,
          loc.lat,
          loc.lng
        );

        if (distance < threshold) {
          // Add to existing cluster
          cluster.count++;
          cluster.center.lat = (cluster.center.lat * (cluster.count - 1) + loc.lat) / cluster.count;
          cluster.center.lng = (cluster.center.lng * (cluster.count - 1) + loc.lng) / cluster.count;
          cluster.lastSeen = new Date(Math.max(cluster.lastSeen.getTime(), new Date(loc.timestamp).getTime()));
          foundCluster = true;
          break;
        }
      }

      if (!foundCluster) {
        clusters.set(`${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`, {
          center: { lat: loc.lat, lng: loc.lng },
          count: 1,
          firstSeen: new Date(loc.timestamp),
          lastSeen: new Date(loc.timestamp),
          avgStayDuration: 0,
        });
      }
    }

    return Array.from(clusters.values());
  }

  // Classify location type
  private classifyLocation(cluster: any): 'home' | 'work' | 'frequent' | 'transit' {
    const hour = new Date(cluster.firstSeen).getHours();
    
    // If mostly visited during evening/night, likely home
    if (hour >= 18 || hour <= 6) return 'home';
    
    // If visited during work hours, likely work
    if (hour >= 9 && hour <= 17) return 'work';
    
    // If high visit count, frequent
    if (cluster.count > 20) return 'frequent';
    
    return 'transit';
  }

  // Generate location name
  private generateLocationName(cluster: any, type: string): string {
    const typeNames = {
      home: 'Home',
      work: 'Work',
      frequent: 'Frequent Location',
      transit: 'Transit Point',
    };
    return typeNames[type as keyof typeof typeNames] || 'Unknown';
  }

  // Build behavior profile
  private async buildBehaviorProfile(
    imei: string,
    movementPatterns: MovementPattern[],
    knownLocations: KnownLocation[]
  ): Promise<BehaviorProfile> {
    const locations = await DeviceLocation.find({ imei })
      .sort({ timestamp: -1 })
      .limit(500);

    if (locations.length < 10) {
      return {
        activityLevel: 'low',
        typicalDayStart: 8,
        typicalDayEnd: 18,
        mobilityScore: 0,
        predictabilityScore: 0,
        anomalyCount: 0,
      };
    }

    const activityLevel = this.calculateActivityLevel(locations);
    const typicalDayStart = this.calculateTypicalDayStart(locations);
    const typicalDayEnd = this.calculateTypicalDayEnd(locations);
    const mobilityScore = this.calculateMobilityScore(movementPatterns);
    const predictabilityScore = this.calculatePredictabilityScore(movementPatterns, knownLocations);
    const anomalyCount = await this.countAnomalies(imei, locations);

    return {
      activityLevel,
      typicalDayStart,
      typicalDayEnd,
      mobilityScore,
      predictabilityScore,
      anomalyCount,
    };
  }

  private calculateActivityLevel(locations: any[]): 'low' | 'medium' | 'high' {
    const movementCount = locations.length;
    const daysCovered = new Set(locations.map(l => new Date(l.timestamp).toDateString())).size;
    const avgPerDay = movementCount / daysCovered;

    if (avgPerDay < 10) return 'low';
    if (avgPerDay < 50) return 'medium';
    return 'high';
  }

  private calculateTypicalDayStart(locations: any[]): number {
    const hours = locations.map(l => new Date(l.timestamp).getHours());
    const counts = new Map<number, number>();
    
    for (const hour of hours) {
      counts.set(hour, (counts.get(hour) || 0) + 1);
    }

    let maxCount = 0;
    let startHour = 8;

    for (const [hour, count] of counts) {
      if (count > maxCount && hour >= 5 && hour <= 12) {
        maxCount = count;
        startHour = hour;
      }
    }

    return startHour;
  }

  private calculateTypicalDayEnd(locations: any[]): number {
    const hours = locations.map(l => new Date(l.timestamp).getHours());
    const counts = new Map<number, number>();
    
    for (const hour of hours) {
      counts.set(hour, (counts.get(hour) || 0) + 1);
    }

    let maxCount = 0;
    let endHour = 18;

    for (const [hour, count] of counts) {
      if (count > maxCount && hour >= 17 && hour <= 23) {
        maxCount = count;
        endHour = hour;
      }
    }

    return endHour;
  }

  private calculateMobilityScore(movementPatterns: MovementPattern[]): number {
    if (movementPatterns.length === 0) return 0;

    const avgSpeed = movementPatterns.reduce((sum, p) => sum + p.averageSpeed, 0) / movementPatterns.length;
    return Math.min(avgSpeed / 50, 1); // Normalize to 0-1
  }

  private calculatePredictabilityScore(movementPatterns: MovementPattern[], knownLocations: KnownLocation[]): number {
    if (movementPatterns.length === 0) return 0;

    const avgConfidence = movementPatterns.reduce((sum, p) => sum + p.confidence, 0) / movementPatterns.length;
    const locationDiversity = Math.min(knownLocations.length / 10, 1);

    return (avgConfidence + (1 - locationDiversity)) / 2;
  }

  private async countAnomalies(imei: string, locations: any[]): Promise<number> {
    // Count events flagged as anomalies
    const events = await TrackingEvent.find({ imei, anomaly: true });
    return events.length;
  }

  // Calculate recovery likelihood
  private async calculateRecoveryLikelihood(
    imei: string,
    riskHistory: RiskHistoryEntry[],
    behaviorProfile: BehaviorProfile
  ): Promise<number {
    let score = 0.5; // Base score

    // Factor in recent risk history
    if (riskHistory.length > 0) {
      const recentRisk = riskHistory[0].riskScore;
      score -= recentRisk / 200; // Higher risk = lower recovery likelihood
    }

    // Factor in behavior predictability
    score += behaviorProfile.predictabilityScore * 0.2;

    // Factor in activity level
    if (behaviorProfile.activityLevel === 'high') {
      score += 0.1;
    }

    // Factor in anomaly count
    score -= behaviorProfile.anomalyCount * 0.05;

    return Math.max(0, Math.min(1, score));
  }

  // Update digital twin with new data
  async updateDigitalTwin(imei: string): Promise<void> {
    // Invalidate cache
    this.cache.delete(imei);

    // Rebuild
    await this.getDigitalTwin(imei);
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Helper: Haversine distance
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

// Singleton instance
export const digitalTwinManager = new DigitalTwinManager();

// Convenience function
export async function getDeviceDigitalTwin(imei: string): Promise<DeviceDigitalTwin> {
  return digitalTwinManager.getDigitalTwin(imei);
}
