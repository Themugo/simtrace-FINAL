// Security Monitoring System
// Anomaly detection, suspicious login detection, admin abuse monitoring

import { logSecurityEvent } from '../observability/auditLogger.js';

// Anomaly detection thresholds
const thresholds = {
  failedLoginAttempts: 5,
  rapidRequests: 100, // per minute
  unusualLocation: true,
  unusualTime: true,
  dataAccessVolume: 1000, // records per minute
};

// Suspicious activity detection
export class SecurityMonitor {
  constructor() {
    this.failedLogins = new Map();
    this.requestCounts = new Map();
    this.dataAccessCounts = new Map();
  }

  // Track failed login attempts
  trackFailedLogin(ip, email) {
    const key = `${ip}:${email}`;
    const count = (this.failedLogins.get(key) || 0) + 1;
    this.failedLogins.set(key, count);

    if (count >= thresholds.failedLoginAttempts) {
      this.triggerAlert('BRUTE_FORCE_DETECTED', {
        ip,
        email,
        attempts: count,
      });
    }

    // Reset after 15 minutes
    setTimeout(() => this.failedLogins.delete(key), 15 * 60 * 1000);
  }

  // Track request rates
  trackRequest(ip, userId) {
    const key = `${ip}:${userId || 'anonymous'}`;
    const count = (this.requestCounts.get(key) || 0) + 1;
    this.requestCounts.set(key, count);

    if (count >= thresholds.rapidRequests) {
      this.triggerAlert('RAPID_REQUEST_DETECTED', {
        ip,
        userId,
        requests: count,
      });
    }

    // Reset after 1 minute
    setTimeout(() => this.requestCounts.delete(key), 60 * 1000);
  }

  // Track data access volume
  trackDataAccess(userId, recordCount) {
    const count = (this.dataAccessCounts.get(userId) || 0) + recordCount;
    this.dataAccessCounts.set(userId, count);

    if (count >= thresholds.dataAccessVolume) {
      this.triggerAlert('EXCESSIVE_DATA_ACCESS', {
        userId,
        records: count,
      });
    }

    // Reset after 1 minute
    setTimeout(() => this.dataAccessCounts.delete(userId), 60 * 1000);
  }

  // Detect unusual location
  detectUnusualLocation(userId, currentLocation, previousLocations) {
    if (!previousLocations || previousLocations.length === 0) {
      return false;
    }

    const lastLocation = previousLocations[previousLocations.length - 1];
    const distance = this.calculateDistance(currentLocation, lastLocation);

    // If distance is > 1000km in < 1 hour, flag as unusual
    if (distance > 1000) {
      this.triggerAlert('UNUSUAL_LOCATION_DETECTED', {
        userId,
        currentLocation,
        lastLocation,
        distance,
      });
      return true;
    }

    return false;
  }

  // Detect unusual time
  detectUnusualTime(userId, currentTime, usualTimes) {
    const hour = currentTime.getHours();
    
    // If access is outside usual hours (e.g., 2am-6am for business users)
    if (hour >= 2 && hour <= 6) {
      this.triggerAlert('UNUSUAL_TIME_DETECTED', {
        userId,
        time: currentTime,
      });
      return true;
    }

    return false;
  }

  // Calculate distance between two coordinates
  calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(loc2.lat - loc1.lat);
    const dLon = this.toRad(loc2.lon - loc1.lon);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRad(loc1.lat)) * Math.cos(this.toRad(loc2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Trigger security alert
  triggerAlert(eventType, details) {
    logSecurityEvent(eventType, 'high', details);
    
    // In production, send to security team via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SIEM system
  }

  // Monitor admin abuse
  monitorAdminAction(userId, action, resource) {
    const sensitiveActions = [
      'user_delete',
      'permission_change',
      'data_export',
      'configuration_change',
    ];

    if (sensitiveActions.includes(action)) {
      this.triggerAlert('ADMIN_SENSITIVE_ACTION', {
        userId,
        action,
        resource,
      });
    }
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Middleware to track requests
export function securityMonitoringMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user?.id;

  // Track request rate
  securityMonitor.trackRequest(ip, userId);

  // Track failed login attempts
  if (req.path === '/api/auth/login' && res.statusCode === 401) {
    securityMonitor.trackFailedLogin(ip, req.body?.email);
  }

  next();
}
