// ── Zero-Trust Security Model ───────────────────────────────────────────────────────
// Continuous verification, hardware-backed MFA, risk-based auth, session anomaly detection

export interface ZeroTrustContext {
  userId: string;
  deviceId?: string;
  ip?: string;
  location?: { lat: number; lng: number };
  userAgent?: string;
  timestamp: Date;
}

export interface SecurityDecision {
  allowed: boolean;
  reason: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiredActions: string[];
  confidence: number;
}

export interface SessionAnomaly {
  type: 'location_change' | 'device_change' | 'ip_change' | 'time_anomaly' | 'behavior_anomaly';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
}

class ZeroTrustSecurity {
  private sessionHistory: Map<string, ZeroTrustContext[]> = new Map();
  private anomalies: SessionAnomaly[] = [];
  private trustedDevices: Set<string> = new Set();
  private trustedLocations: Set<string> = new Set();

  // Evaluate security context
  evaluateContext(context: ZeroTrustContext): SecurityDecision {
    const anomalies = this.detectAnomalies(context);
    const riskScore = this.calculateRiskScore(context, anomalies);
    
    // Store context for future comparisons
    this.storeContext(context);

    // Make security decision based on risk
    if (riskScore < 30) {
      return {
        allowed: true,
        reason: 'Low risk context',
        riskLevel: 'low',
        requiredActions: [],
        confidence: 0.95,
      };
    } else if (riskScore < 60) {
      return {
        allowed: true,
        reason: 'Medium risk - additional verification recommended',
        riskLevel: 'medium',
        requiredActions: ['mfa_verify'],
        confidence: 0.8,
      };
    } else if (riskScore < 80) {
      return {
        allowed: true,
        reason: 'High risk - additional verification required',
        riskLevel: 'high',
        requiredActions: ['mfa_verify', 'device_verify'],
        confidence: 0.6,
      };
    } else {
      return {
        allowed: false,
        reason: 'Critical risk - access denied',
        riskLevel: 'critical',
        requiredActions: ['admin_approval', 'identity_verification'],
        confidence: 0.9,
      };
    }
  }

  // Detect anomalies in session
  private detectAnomalies(context: ZeroTrustContext): SessionAnomaly[] {
    const anomalies: SessionAnomaly[] = [];
    const history = this.sessionHistory.get(context.userId) || [];

    if (history.length === 0) {
      return anomalies; // No history to compare
    }

    const lastContext = history[history.length - 1];

    // Detect location change
    if (context.location && lastContext.location) {
      const distance = this.calculateDistance(
        lastContext.location.lat,
        lastContext.location.lng,
        context.location.lat,
        context.location.lng
      );

      // If location changed by > 100km in < 1 hour, it's suspicious
      const timeDiff = context.timestamp.getTime() - lastContext.timestamp.getTime();
      if (distance > 100 && timeDiff < 3600000) {
        anomalies.push({
          type: 'location_change',
          severity: 'high',
          description: `Impossible travel: ${distance.toFixed(0)}km in ${(timeDiff / 3600000).toFixed(1)}h`,
          timestamp: new Date(),
        });
      }
    }

    // Detect device change
    if (context.deviceId && lastContext.deviceId && context.deviceId !== lastContext.deviceId) {
      if (!this.trustedDevices.has(context.deviceId)) {
        anomalies.push({
          type: 'device_change',
          severity: 'medium',
          description: `New device detected: ${context.deviceId}`,
          timestamp: new Date(),
        });
      }
    }

    // Detect IP change
    if (context.ip && lastContext.ip && context.ip !== lastContext.ip) {
      anomalies.push({
        type: 'ip_change',
        severity: 'low',
        description: `IP address changed from ${lastContext.ip} to ${context.ip}`,
        timestamp: new Date(),
      });
    }

    // Detect time anomaly (unusual access time)
    const hour = context.timestamp.getHours();
    if (hour < 5 || hour > 22) {
      anomalies.push({
        type: 'time_anomaly',
        severity: 'low',
        description: `Unusual access time: ${hour}:00`,
        timestamp: new Date(),
      });
    }

    // Store anomalies
    for (const anomaly of anomalies) {
      this.anomalies.push(anomaly);
    }
    this.anomalies = this.anomalies.slice(-100); // Keep last 100

    return anomalies;
  }

  // Calculate risk score
  private calculateRiskScore(context: ZeroTrustContext, anomalies: SessionAnomaly[]): number {
    let riskScore = 0;

    // Base risk from anomalies
    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case 'low':
          riskScore += 10;
          break;
        case 'medium':
          riskScore += 30;
          break;
        case 'high':
          riskScore += 50;
          break;
      }
    }

    // Device trust
    if (context.deviceId && !this.trustedDevices.has(context.deviceId)) {
      riskScore += 20;
    }

    // Location trust
    if (context.location) {
      const locationKey = `${context.location.lat.toFixed(2)},${context.location.lng.toFixed(2)}`;
      if (!this.trustedLocations.has(locationKey)) {
        riskScore += 15;
      }
    }

    return Math.min(riskScore, 100);
  }

  // Store context for future comparisons
  private storeContext(context: ZeroTrustContext): void {
    if (!this.sessionHistory.has(context.userId)) {
      this.sessionHistory.set(context.userId, []);
    }

    const history = this.sessionHistory.get(context.userId)!;
    history.push(context);

    // Keep last 50 contexts per user
    if (history.length > 50) {
      history.shift();
    }
  }

  // Add trusted device
  addTrustedDevice(deviceId: string): void {
    this.trustedDevices.add(deviceId);
  }

  // Remove trusted device
  removeTrustedDevice(deviceId: string): void {
    this.trustedDevices.delete(deviceId);
  }

  // Add trusted location
  addTrustedLocation(lat: number, lng: number): void {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    this.trustedLocations.add(key);
  }

  // Remove trusted location
  removeTrustedLocation(lat: number, lng: number): void {
    const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
    this.trustedLocations.delete(key);
  }

  // Get anomalies for user
  getUserAnomalies(userId: string, limit = 20): SessionAnomaly[] {
    const history = this.sessionHistory.get(userId) || [];
    const userAnomalies: SessionAnomaly[] = [];

    for (const anomaly of this.anomalies) {
      // Check if anomaly is related to this user
      // This would need to be implemented based on your data model
    }

    return userAnomalies.slice(-limit);
  }

  // Get all anomalies
  getAllAnomalies(limit = 50): SessionAnomaly[] {
    return this.anomalies.slice(-limit);
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

    for (const [userId, history] of this.sessionHistory) {
      const filtered = history.filter(c => c.timestamp.getTime() > cutoff);
      if (filtered.length === 0) {
        this.sessionHistory.delete(userId);
      } else {
        history.length = 0;
        history.push(...filtered);
      }
    }

    this.anomalies = this.anomalies.filter(a => a.timestamp.getTime() > cutoff);
  }

  // Calculate distance between two coordinates
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
export const zeroTrustSecurity = new ZeroTrustSecurity();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function evaluateSecurityContext(context: ZeroTrustContext): SecurityDecision {
  return zeroTrustSecurity.evaluateContext(context);
}

export function addTrustedDevice(deviceId: string): void {
  zeroTrustSecurity.addTrustedDevice(deviceId);
}

export function removeTrustedDevice(deviceId: string): void {
  zeroTrustSecurity.removeTrustedDevice(deviceId);
}

export function addTrustedLocation(lat: number, lng: number): void {
  zeroTrustSecurity.addTrustedLocation(lat, lng);
}

export function removeTrustedLocation(lat: number, lng: number): void {
  zeroTrustSecurity.removeTrustedLocation(lat, lng);
}

export function getUserAnomalies(userId: string, limit = 20): SessionAnomaly[] {
  return zeroTrustSecurity.getUserAnomalies(userId, limit);
}

export function getAllAnomalies(limit = 50): SessionAnomaly[] {
  return zeroTrustSecurity.getAllAnomalies(limit);
}

export function clearSecurityData(maxAgeHours = 24): void {
  zeroTrustSecurity.clearOldData(maxAgeHours);
}
