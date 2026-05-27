import { emit } from '../events/index.js';
import { assessDeviceRisk } from '../modules/risk/engine.js';
import { enrichGeolocation } from '../modules/tracking/geolocation.js';
import { detectAntiSpoofing } from '../modules/tracking/antispoof.js';
import { TrackingEvent, DeviceLocation, DeviceSession } from '../db/index.js';
import { getRedisClient } from '../services/redis.js';

// ── Telemetry Pipeline ─────────────────────────────────────────────────────────
// Pipeline stages: ingest → validate → enrich → score → store → broadcast → analyze

export interface TelemetryData {
  imei: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  ipAddress?: string;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
    screenResolution?: string;
  };
  simInfo?: {
    iccid?: string;
    operator?: string;
    country?: string;
  };
  battery?: number;
  signalStrength?: number;
  networkType?: string;
}

export interface PipelineResult {
  success: boolean;
  data?: any;
  errors?: string[];
  stage?: string;
}

class TelemetryPipeline {
  private deduplicationWindow = 60; // seconds
  private deduplicationKeyPrefix = 'telemetry:dedup:';

  // Main pipeline entry point
  async process(data: TelemetryData): Promise<PipelineResult> {
    try {
      // Stage 1: Ingest
      const ingestResult = await this.ingest(data);
      if (!ingestResult.success) return ingestResult;

      // Stage 2: Validate
      const validateResult = await this.validate(data);
      if (!validateResult.success) return validateResult;

      // Stage 3: Deduplicate
      const dedupResult = await this.deduplicate(data);
      if (!dedupResult.success) {
        // Duplicate detected, skip processing
        return { success: true, data: { duplicate: true }, stage: 'deduplicate' };
      }

      // Stage 4: Enrich
      const enrichedData = await this.enrich(data);

      // Stage 5: Score
      const scoredData = await this.score(enrichedData);

      // Stage 6: Store
      const storeResult = await this.store(scoredData);
      if (!storeResult.success) return storeResult;

      // Stage 7: Broadcast
      await this.broadcast(scoredData);

      // Stage 8: Analyze (async, don't block)
      this.analyze(scoredData).catch(error => {
        console.error('[Telemetry] Analysis error:', error);
      });

      return { success: true, data: scoredData };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }

  // Stage 1: Ingest - Accept raw telemetry data
  private async ingest(data: TelemetryData): Promise<PipelineResult> {
    // Basic ingestion checks
    if (!data.imei) {
      return { success: false, errors: ['IMEI is required'], stage: 'ingest' };
    }

    if (!data.timestamp) {
      return { success: false, errors: ['Timestamp is required'], stage: 'ingest' };
    }

    return { success: true };
  }

  // Stage 2: Validate - Ensure data integrity
  private async validate(data: TelemetryData): Promise<PipelineResult> {
    const errors: string[] = [];

    // Validate IMEI format (15 digits)
    if (!/^\d{15}$/.test(data.imei)) {
      errors.push('Invalid IMEI format');
    }

    // Validate timestamp (not in future, not too old)
    const now = new Date();
    const timestamp = new Date(data.timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (timestamp > now) {
      errors.push('Timestamp cannot be in the future');
    }

    if (now.getTime() - timestamp.getTime() > maxAge) {
      errors.push('Timestamp is too old');
    }

    // Validate location if present
    if (data.location) {
      if (data.location.lat < -90 || data.location.lat > 90) {
        errors.push('Invalid latitude');
      }
      if (data.location.lng < -180 || data.location.lng > 180) {
        errors.push('Invalid longitude');
      }
    }

    // Validate battery if present
    if (data.battery !== undefined) {
      if (data.battery < 0 || data.battery > 100) {
        errors.push('Invalid battery level');
      }
    }

    if (errors.length > 0) {
      return { success: false, errors, stage: 'validate' };
    }

    return { success: true };
  }

  // Stage 3: Deduplicate - Prevent duplicate processing
  private async deduplicate(data: TelemetryData): Promise<PipelineResult> {
    const redis = getRedisClient();
    
    // Generate deduplication key based on IMEI and timestamp window
    const timestamp = new Date(data.timestamp);
    const windowStart = Math.floor(timestamp.getTime() / (this.deduplicationWindow * 1000));
    const dedupKey = `${this.deduplicationKeyPrefix}${data.imei}:${windowStart}`;
    
    // Check if already processed
    const exists = await redis.exists(dedupKey);
    
    if (exists === 1) {
      return { success: false, stage: 'deduplicate' };
    }
    
    // Mark as processed
    await redis.set(dedupKey, '1', { EX: this.deduplicationWindow * 2 });
    
    return { success: true };
  }

  // Stage 4: Enrich - Add additional data
  private async enrich(data: TelemetryData): Promise<any> {
    const enriched = { ...data };

    // Enrich geolocation
    if (data.location) {
      const geoData = await enrichGeolocation(data.location.lat, data.location.lng);
      enriched.geolocation = geoData;
    }

    // Enrich IP information
    if (data.ipAddress) {
      enriched.ipInfo = await this.enrichIP(data.ipAddress);
    }

    // Enrich device fingerprint
    if (data.deviceInfo) {
      enriched.deviceFingerprint = this.generateDeviceFingerprint(data.deviceInfo);
    }

    return enriched;
  }

  // Stage 5: Score - Calculate risk scores
  private async score(data: any): Promise<any> {
    const scored = { ...data };

    // Perform anti-spoofing detection
    if (data.deviceInfo) {
      const antiSpoofResult = await detectAntiSpoofing(data.imei, data.deviceInfo);
      scored.antiSpoof = antiSpoofResult;
    }

    // Calculate risk score
    const riskAssessment = await assessDeviceRisk(
      data.imei,
      data.ipAddress,
      data.deviceInfo
    );
    scored.risk = riskAssessment;

    return scored;
  }

  // Stage 6: Store - Persist to database
  private async store(data: any): Promise<PipelineResult> {
    try {
      // Store tracking event
      await TrackingEvent.create({
        imei: data.imei,
        timestamp: data.timestamp,
        location: data.location,
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
        simInfo: data.simInfo,
        battery: data.battery,
        signalStrength: data.signalStrength,
        networkType: data.networkType,
        geolocation: data.geolocation,
        ipInfo: data.ipInfo,
        riskScore: data.risk?.overallScore,
        threatLevel: data.risk?.threatLevel,
      });

      // Store device location
      if (data.location) {
        await DeviceLocation.create({
          imei: data.imei,
          lat: data.location.lat,
          lng: data.location.lng,
          accuracy: data.location.accuracy,
          timestamp: data.timestamp,
          geolocation: data.geolocation,
        });
      }

      // Update or create device session
      await this.updateDeviceSession(data);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
        stage: 'store',
      };
    }
  }

  // Stage 7: Broadcast - Emit events
  private async broadcast(data: any): Promise<void> {
    // Emit location detected event
    if (data.location) {
      emit('location.detected', {
        imei: data.imei,
        location: data.location,
        timestamp: data.timestamp,
      });
    }

    // Emit risk calculated event
    if (data.risk) {
      emit('risk.calculated', {
        imei: data.imei,
        riskAssessment: data.risk,
      });
    }

    // Emit device detected event
    emit('device.detected', {
      imei: data.imei,
      timestamp: data.timestamp,
      location: data.location,
    });
  }

  // Stage 8: Analyze - Perform deeper analysis (async)
  private async analyze(data: any): Promise<void> {
    // Check for SIM changes
    if (data.simInfo) {
      await this.checkSIMChange(data);
    }

    // Check for impossible travel
    if (data.location) {
      await this.checkImpossibleTravel(data);
    }

    // Update analytics
    await this.updateAnalytics(data);
  }

  // Helper: Enrich IP information
  private async enrichIP(ip: string): Promise<any> {
    // In production, integrate with IP geolocation service
    // For now, return basic info
    return {
      ip,
      country: 'Unknown',
      city: 'Unknown',
      isp: 'Unknown',
    };
  }

  // Helper: Generate device fingerprint
  private generateDeviceFingerprint(deviceInfo: any): string {
    const fingerprintData = {
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      screenResolution: deviceInfo.screenResolution,
    };
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(JSON.stringify(fingerprintData)).digest('hex');
  }

  // Helper: Update device session
  private async updateDeviceSession(data: any): Promise<void> {
    const now = new Date();
    const sessionWindow = 30 * 60 * 1000; // 30 minutes

    // Find recent session
    const recentSession = await DeviceSession.findOne({
      imei: data.imei,
      lastSeen: { $gte: new Date(now.getTime() - sessionWindow) },
    });

    if (recentSession) {
      // Update existing session
      recentSession.lastSeen = now;
      recentSession.eventCount += 1;
      if (data.location) {
        recentSession.locations.push({
          lat: data.location.lat,
          lng: data.location.lng,
          timestamp: data.timestamp,
        });
      }
      await recentSession.save();
    } else {
      // Create new session
      await DeviceSession.create({
        imei: data.imei,
        startedAt: data.timestamp,
        lastSeen: now,
        eventCount: 1,
        locations: data.location ? [{
          lat: data.location.lat,
          lng: data.location.lng,
          timestamp: data.timestamp,
        }] : [],
        ipAddress: data.ipAddress,
        deviceInfo: data.deviceInfo,
      });
    }
  }

  // Helper: Check for SIM changes
  private async checkSIMChange(data: any): Promise<void> {
    // Get previous SIM info for this device
    const previousEvent = await TrackingEvent.findOne({
      imei: data.imei,
      simInfo: { $exists: true },
    }).sort({ timestamp: -1 });

    if (previousEvent && previousEvent.simInfo?.iccid !== data.simInfo?.iccid) {
      emit('sim.changed', {
        imei: data.imei,
        oldSimIccid: previousEvent.simInfo?.iccid,
        newSimIccid: data.simInfo?.iccid,
        timestamp: data.timestamp,
      });
    }
  }

  // Helper: Check for impossible travel
  private async checkImpossibleTravel(data: any): Promise<void> {
    if (!data.location) return;

    // Get previous location
    const previousLocation = await DeviceLocation.findOne({
      imei: data.imei,
    }).sort({ timestamp: -1 });

    if (previousLocation && previousLocation.location) {
      const distance = this.calculateDistance(
        previousLocation.location.lat,
        previousLocation.location.lng,
        data.location.lat,
        data.location.lng
      );

      const timeDiff = new Date(data.timestamp).getTime() - new Date(previousLocation.timestamp).getTime();
      const speed = distance / (timeDiff / 1000 / 3600); // km/h

      // If speed > 1000 km/h, it's impossible travel
      if (speed > 1000) {
        emit('risk.high', {
          imei: data.imei,
          reason: 'impossible_travel',
          speed,
          distance,
          timeDiff,
        });
      }
    }
  }

  // Helper: Calculate distance between two points (Haversine formula)
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

  // Helper: Update analytics
  private async updateAnalytics(data: any): Promise<void> {
    // Update analytics counters
    const redis = getRedisClient();
    
    await redis.incr('analytics:total_events');
    await redis.incr(`analytics:events:${data.imei}`);
    
    if (data.location) {
      await redis.geoadd('analytics:locations', data.location.lng, data.location.lat, data.imei);
    }
  }
}

// Singleton instance
export const telemetryPipeline = new TelemetryPipeline();

// Convenience function
export async function processTelemetry(data: TelemetryData): Promise<PipelineResult> {
  return telemetryPipeline.process(data);
}
