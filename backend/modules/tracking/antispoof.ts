import { TrackingEvent, Device } from '../../db/index.js';

// ── Anti-Spoofing Detection ─────────────────────────────────────────────────────
export interface SpoofDetectionResult {
  isSpoofed: boolean;
  confidence: number;
  type: 'fake_gps' | 'impossible_travel' | 'emulator' | 'rooted' | 'vpn_proxy' | 'imei_mismatch';
  details: Record<string, unknown>;
}

// Detect fake GPS signals
export async function detectFakeGps(imei: string, lat: number, lng: number, accuracy?: number): Promise<SpoofDetectionResult> {
  const suspiciousIndicators: string[] = [];
  let confidence = 0;
  
  // Check for extremely high accuracy (suspicious for real GPS)
  if (accuracy && accuracy < 1) {
    suspiciousIndicators.push('extremely_high_accuracy');
    confidence += 20;
  }
  
  // Check for location jumping (rapid movement between distant points)
  const recentEvents = await TrackingEvent.find({
    imei,
    eventType: 'location_update',
  }).sort({ timestamp: -1 }).limit(10);
  
  if (recentEvents.length > 1) {
    const lastEvent = recentEvents[0];
    const timeDiff = Date.now() - lastEvent.timestamp.getTime();
    
    if (timeDiff < 5000) { // Less than 5 seconds
      suspiciousIndicators.push('rapid_location_updates');
      confidence += 30;
    }
  }
  
  // Check for coordinates with no variation (static GPS)
  const staticLocations = await TrackingEvent.find({
    imei,
    eventType: 'location_update',
    'data.lat': lat,
    'data.lng': lng,
  }).countDocuments();
  
  if (staticLocations > 10) {
    suspiciousIndicators.push('static_coordinates');
    confidence += 25;
  }
  
  return {
    isSpoofed: confidence > 50,
    confidence,
    type: 'fake_gps',
    details: { suspiciousIndicators },
  };
}

// Detect emulator behavior
export async function detectEmulator(_imei: string, deviceInfo: Record<string, unknown>): Promise<SpoofDetectionResult> {
  const suspiciousIndicators: string[] = [];
  let confidence = 0;
  const di = deviceInfo as { model?: string; buildId?: string; buildTags?: string; hasTelephony?: boolean; hasCamera?: boolean };
  
  // Check for common emulator indicators
  const emulatorIndicators = [
    'generic',
    'sdk',
    'emulator',
    'android sdk',
    'goldfish',
    'vbox',
    'virtual',
  ];
  
  const model = di.model?.toLowerCase() || '';
  const buildId = di.buildId?.toLowerCase() || '';
  
  for (const indicator of emulatorIndicators) {
    if (model.includes(indicator) || buildId.includes(indicator)) {
      suspiciousIndicators.push(`emulator_indicator_${indicator}`);
      confidence += 30;
    }
  }
  
  // Check for suspicious build properties
  if (di.buildTags?.includes('test-keys')) {
    suspiciousIndicators.push('test_keys_build');
    confidence += 25;
  }
  
  // Check for missing hardware features
  if (!di.hasTelephony || !di.hasCamera) {
    suspiciousIndicators.push('missing_hardware');
    confidence += 20;
  }
  
  return {
    isSpoofed: confidence > 50,
    confidence,
    type: 'emulator',
    details: { suspiciousIndicators, deviceInfo },
  };
}

// Detect rooted devices
export async function detectRooted(_imei: string, deviceInfo: Record<string, unknown>): Promise<SpoofDetectionResult> {
  const suspiciousIndicators: string[] = [];
  let confidence = 0;
  const di = deviceInfo as { installedApps?: string[]; canWriteSystemPartition?: boolean; kernelVersion?: string };
  
  // Check for root indicators
  const rootIndicators = [
    'su',
    'superuser',
    'magisk',
    'busybox',
    'xposed',
    'frida',
    'substrate',
  ];
  
  const installedApps = di.installedApps || [];
  
  for (const indicator of rootIndicators) {
    if (installedApps.some((app: string) => app.toLowerCase().includes(indicator))) {
      suspiciousIndicators.push(`root_indicator_${indicator}`);
      confidence += 35;
    }
  }
  
  // Check for system partition write access
  if (di.canWriteSystemPartition) {
    suspiciousIndicators.push('system_write_access');
    confidence += 40;
  }
  
  // Check for unsafe kernel
  if (di.kernelVersion?.includes('test') || di.kernelVersion?.includes('debug')) {
    suspiciousIndicators.push('debug_kernel');
    confidence += 25;
  }
  
  return {
    isSpoofed: confidence > 50,
    confidence,
    type: 'rooted',
    details: { suspiciousIndicators, deviceInfo },
  };
}

// Detect VPN/Proxy usage
export async function detectVpnProxy(_ipAddress: string): Promise<SpoofDetectionResult> {
  const suspiciousIndicators: string[] = [];
  
  // In production, integrate with IP intelligence services like:
  // - IPQualityScore
  // - MaxMind
  // - IP2Location
  // - AbuseIPDB
  
  // Placeholder implementation
  // Check if IP is from known VPN/proxy providers
  
  // For now, return no detection
  return {
    isSpoofed: false,
    confidence: 0,
    type: 'vpn_proxy',
    details: { suspiciousIndicators },
  };
}

// Detect IMEI mismatch
export async function detectImeiMismatch(imei: string, reportedImei: string): Promise<SpoofDetectionResult> {
  const device = await Device.findOne({ imei });
  
  if (!device) {
    return {
      isSpoofed: false,
      confidence: 0,
      type: 'imei_mismatch',
      details: { reason: 'device_not_found' },
    };
  }
  
  // Check if reported IMEI matches stored IMEI
  if (device.imei !== reportedImei) {
    return {
      isSpoofed: true,
      confidence: 80,
      type: 'imei_mismatch',
      details: {
        storedImei: device.imei,
        reportedImei,
      },
    };
  }
  
  return {
    isSpoofed: false,
    confidence: 0,
    type: 'imei_mismatch',
    details: { match: true },
  };
}

// Run comprehensive anti-spoofing check
export async function runAntiSpoofCheck(data: {
  imei: string;
  lat: number;
  lng: number;
  accuracy?: number;
  ipAddress?: string;
  deviceInfo?: Record<string, unknown>;
}) {
  const results = await Promise.all([
    detectFakeGps(data.imei, data.lat, data.lng, data.accuracy),
    data.deviceInfo ? detectEmulator(data.imei, data.deviceInfo) : Promise.resolve({ isSpoofed: false, confidence: 0, type: 'emulator', details: {} }),
    data.deviceInfo ? detectRooted(data.imei, data.deviceInfo) : Promise.resolve({ isSpoofed: false, confidence: 0, type: 'rooted', details: {} }),
    data.ipAddress ? detectVpnProxy(data.ipAddress) : Promise.resolve({ isSpoofed: false, confidence: 0, type: 'vpn_proxy', details: {} }),
  ]);
  
  const spoofedResults = results.filter(r => r.isSpoofed);
  
  return {
    overallRisk: spoofedResults.length > 0 ? 'high' : 'low',
    detections: results,
    summary: {
      totalChecks: results.length,
      spoofedCount: spoofedResults.length,
      maxConfidence: Math.max(...results.map(r => r.confidence)),
    },
  };
}
