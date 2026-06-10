import { TrackingEvent, Device } from '../../db/index.js';
import { detectImpossibleTravel } from '../tracking/session.js';
import { runAntiSpoofCheck } from '../tracking/antispoof.js';

// ── Risk Signal Definitions ─────────────────────────────────────────────────────
export interface RiskSignal {
  type: 'sim_swap' | 'rooted_device' | 'impossible_travel' | 'vpn_detected' | 'imei_mismatch' | 'fake_gps' | 'emulator' | 'fingerprint_change';
  score: number;
  description: string;
  timestamp: Date;
  details?: Record<string, unknown>;
}

export interface RiskAssessment {
  deviceRisk: number; // 0-100
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  signals: RiskSignal[];
  lastUpdated: Date;
  recommendations: string[];
}

// Risk signal scores (configurable)
const RISK_SCORES = {
  sim_swap: 40,
  rooted_device: 25,
  impossible_travel: 50,
  vpn_detected: 15,
  imei_mismatch: 80,
  fake_gps: 30,
  emulator: 35,
  fingerprint_change: 20,
};

// ── Risk Signal Detection ─────────────────────────────────────────────────────
export async function detectSimSwapSignal(imei: string): Promise<RiskSignal | null> {
  const simChangeEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'sim_change',
  }).sort({ timestamp: -1 });
  
  if (!simChangeEvent) {
    return null;
  }
  
  // Check if SIM swap happened recently (within 24 hours)
  const hoursSinceSwap = (Date.now() - simChangeEvent.timestamp.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceSwap > 24) {
    return null;
  }
  
  return {
    type: 'sim_swap',
    score: RISK_SCORES.sim_swap,
    description: 'SIM card changed recently',
    timestamp: simChangeEvent.timestamp,
    details: simChangeEvent.data,
  };
}

export async function detectRootedDeviceSignal(imei: string): Promise<RiskSignal | null> {
  const suspiciousEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'suspicious_activity',
    'data.type': 'rooted_device',
  }).sort({ timestamp: -1 });
  
  if (!suspiciousEvent) {
    return null;
  }
  
  return {
    type: 'rooted_device',
    score: RISK_SCORES.rooted_device,
    description: 'Device appears to be rooted',
    timestamp: suspiciousEvent.timestamp,
    details: suspiciousEvent.data,
  };
}

export async function detectImpossibleTravelSignal(imei: string): Promise<RiskSignal | null> {
  const impossibleMoves = await detectImpossibleTravel(imei);
  
  if (!impossibleMoves || impossibleMoves.length === 0) {
    return null;
  }
  
  return {
    type: 'impossible_travel',
    score: RISK_SCORES.impossible_travel,
    description: 'Device traveled at impossible speed',
    timestamp: new Date(),
    details: { moves: impossibleMoves },
  };
}

export async function detectVpnSignal(ipAddress: string): Promise<RiskSignal | null> {
  // In production, integrate with IP intelligence services
  // For now, return null
  return null;
}

export async function detectImeiMismatchSignal(imei: string, reportedImei: string): Promise<RiskSignal | null> {
  const device = await Device.findOne({ imei });
  
  if (!device) {
    return null;
  }
  
  if (device.imei !== reportedImei) {
    return {
      type: 'imei_mismatch',
      score: RISK_SCORES.imei_mismatch,
      description: 'Reported IMEI does not match stored IMEI',
      timestamp: new Date(),
      details: {
        storedImei: device.imei,
        reportedImei,
      },
    };
  }
  
  return null;
}

export async function detectFakeGpsSignal(imei: string): Promise<RiskSignal | null> {
  const suspiciousEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'suspicious_activity',
    'data.type': 'fake_gps',
  }).sort({ timestamp: -1 });
  
  if (!suspiciousEvent) {
    return null;
  }
  
  return {
    type: 'fake_gps',
    score: RISK_SCORES.fake_gps,
    description: 'GPS signal appears to be spoofed',
    timestamp: suspiciousEvent.timestamp,
    details: suspiciousEvent.data,
  };
}

export async function detectEmulatorSignal(imei: string): Promise<RiskSignal | null> {
  const suspiciousEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'suspicious_activity',
    'data.type': 'emulator',
  }).sort({ timestamp: -1 });
  
  if (!suspiciousEvent) {
    return null;
  }
  
  return {
    type: 'emulator',
    score: RISK_SCORES.emulator,
    description: 'Device appears to be an emulator',
    timestamp: suspiciousEvent.timestamp,
    details: suspiciousEvent.data,
  };
}

export async function detectFingerprintChangeSignal(imei: string): Promise<RiskSignal | null> {
  const suspiciousEvent = await TrackingEvent.findOne({
    imei,
    eventType: 'suspicious_activity',
    'data.type': 'fingerprint_change',
  }).sort({ timestamp: -1 });
  
  if (!suspiciousEvent) {
    return null;
  }
  
  return {
    type: 'fingerprint_change',
    score: RISK_SCORES.fingerprint_change,
    description: 'Device fingerprint changed',
    timestamp: suspiciousEvent.timestamp,
    details: suspiciousEvent.data,
  };
}

// ── Comprehensive Risk Assessment ───────────────────────────────────────────────
export async function assessDeviceRisk(imei: string, ipAddress?: string, deviceInfo?: Record<string, unknown>): Promise<RiskAssessment> {
  const signals: RiskSignal[] = [];
  
  // Run all risk signal detections
  const [simSwap, rooted, impossibleTravel, vpn, fakeGps, emulator, fingerprintChange] = await Promise.all([
    detectSimSwapSignal(imei),
    detectRootedDeviceSignal(imei),
    detectImpossibleTravelSignal(imei),
    ipAddress ? detectVpnSignal(ipAddress) : Promise.resolve(null),
    detectFakeGpsSignal(imei),
    detectEmulatorSignal(imei),
    detectFingerprintChangeSignal(imei),
  ]);
  
  if (simSwap) signals.push(simSwap);
  if (rooted) signals.push(rooted);
  if (impossibleTravel) signals.push(impossibleTravel);
  if (vpn) signals.push(vpn);
  if (fakeGps) signals.push(fakeGps);
  if (emulator) signals.push(emulator);
  if (fingerprintChange) signals.push(fingerprintChange);
  
  // Calculate total risk score
  let totalRiskScore = 0;
  for (const signal of signals) {
    totalRiskScore += signal.score;
  }
  
  // Cap at 100
  totalRiskScore = Math.min(totalRiskScore, 100);
  
  // Determine threat level
  let threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  if (totalRiskScore >= 80) {
    threatLevel = 'CRITICAL';
  } else if (totalRiskScore >= 60) {
    threatLevel = 'HIGH';
  } else if (totalRiskScore >= 30) {
    threatLevel = 'MEDIUM';
  } else {
    threatLevel = 'LOW';
  }
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (threatLevel === 'CRITICAL') {
    recommendations.push('Immediate investigation required');
    recommendations.push('Consider blocking device access');
    recommendations.push('Alert security team');
  } else if (threatLevel === 'HIGH') {
    recommendations.push('Investigation recommended');
    recommendations.push('Monitor device activity closely');
    recommendations.push('Review recent location history');
  } else if (threatLevel === 'MEDIUM') {
    recommendations.push('Monitor device for further suspicious activity');
    recommendations.push('Review device fingerprint');
  }
  
  if (simSwap) {
    recommendations.push('Verify SIM swap with user');
  }
  
  if (rooted) {
    recommendations.push('Device may be compromised - advise user');
  }
  
  if (impossibleTravel) {
    recommendations.push('Review location data for errors or spoofing');
  }
  
  return {
    deviceRisk: totalRiskScore,
    threatLevel,
    signals,
    lastUpdated: new Date(),
    recommendations,
  };
}

// ── Batch Risk Assessment ─────────────────────────────────────────────────────
export async function assessMultipleDevicesRisk(imeis: string[]): Promise<Map<string, RiskAssessment>> {
  const assessments = new Map<string, RiskAssessment>();
  
  const results = await Promise.all(
    imeis.map(async (imei) => {
      const assessment = await assessDeviceRisk(imei);
      return { imei, assessment };
    })
  );
  
  for (const { imei, assessment } of results) {
    assessments.set(imei, assessment);
  }
  
  return assessments;
}

// ── Risk History Tracking ───────────────────────────────────────────────────────
export async function getRiskHistory(imei: string, days = 30) {
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const riskEvents = await TrackingEvent.find({
    imei,
    timestamp: { $gte: startDate },
    $or: [
      { eventType: 'sim_change' },
      { eventType: 'suspicious_activity' },
    ],
  }).sort({ timestamp: -1 });
  
  return riskEvents;
}
