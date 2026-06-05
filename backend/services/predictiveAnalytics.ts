// services/predictiveAnalytics.ts - AI-Powered Predictive Analytics
// Theft risk prediction and anomaly detection

import { RiskPrediction, AnomalyDetection, Device, Ping } from "../db/index.js";

// ── Risk Prediction ───────────────────────────────────────────────────────────────
export async function generateRiskPrediction(deviceId: string) {
  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  // Collect device data
  const pings = await Ping.find({ device: deviceId })
    .sort({ timestamp: -1 })
    .limit(100);

  // Calculate risk factors
  const factors = await calculateRiskFactors(device, pings);

  // Calculate overall risk score
  const riskScore = calculateRiskScore(factors);
  const riskLevel = getRiskLevel(riskScore);

  // Predict event
  const prediction = predictEvent(riskScore, factors);

  // Generate recommendations
  const recommendations = generateRecommendations(riskLevel, factors);

  // Valid for 24 hours
  const validUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const riskPrediction = await RiskPrediction.create({
    device: deviceId,
    imei: (device as any).imei,
    riskScore,
    riskLevel,
    factors,
    predictedEvent: prediction.event,
    confidence: prediction.confidence,
    recommendations,
    validUntil,
  });

  return riskPrediction;
}

async function calculateRiskFactors(device: any, pings: any[]): Promise<any[]> {
  const factors: any[] = [];

  // Factor 1: Device status
  if (device.stolen) {
    factors.push({
      type: "device_status",
      weight: 0.9,
      description: "Device reported as stolen",
    });
  }

  if (device.status === "blacklisted") {
    factors.push({
      type: "device_status",
      weight: 0.8,
      description: "Device is blacklisted",
    });
  }

  // Factor 2: Location patterns
  if (pings.length >= 10) {
    const locationVariance = calculateLocationVariance(pings);
    if (locationVariance > 1000) { // High variance
      factors.push({
        type: "location_pattern",
        weight: 0.6,
        description: "Unusual location variance detected",
      });
    }
  }

  // Factor 3: Time patterns
  const timePattern = analyzeTimePattern(pings);
  if (timePattern.unusual) {
    factors.push({
      type: "time_pattern",
      weight: 0.4,
      description: "Unusual activity time pattern",
    });
  }

  // Factor 4: Network changes
  const networkChanges = countNetworkChanges(pings);
  if (networkChanges > 5) {
    factors.push({
      type: "network_change",
      weight: 0.5,
      description: "Frequent network changes detected",
    });
  }

  // Factor 5: SIM swaps
  const simSwaps = countSimSwaps(pings);
  if (simSwaps > 0) {
    factors.push({
      type: "sim_swap",
      weight: 0.7,
      description: "SIM swap detected",
    });
  }

  return factors;
}

function calculateLocationVariance(pings: any[]): number {
  if (pings.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < pings.length; i++) {
    const distance = haversineDistance(
      pings[i - 1].lat,
      pings[i - 1].lng,
      pings[i].lat,
      pings[i].lng
    );
    totalDistance += distance;
  }

  return totalDistance / (pings.length - 1);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function analyzeTimePattern(pings: any[]): { unusual: boolean; nightRatio?: number } {
  if (pings.length < 5) return { unusual: false };

  const hours = pings.map((p: any) => new Date(p.timestamp).getHours());
  const nightActivity = hours.filter((h: number) => h >= 0 && h < 6).length;
  const nightRatio = nightActivity / hours.length;

  return {
    unusual: nightRatio > 0.5,
    nightRatio,
  };
}

function countNetworkChanges(pings: any[]): number {
  if (pings.length < 2) return 0;

  let changes = 0;
  let lastCarrier = pings[0].carrier;

  for (let i = 1; i < pings.length; i++) {
    if (pings[i].carrier !== lastCarrier) {
      changes++;
      lastCarrier = pings[i].carrier;
    }
  }

  return changes;
}

function countSimSwaps(pings: any[]): number {
  if (pings.length < 2) return 0;

  let swaps = 0;
  let lastSim = pings[0].simSerial;

  for (let i = 1; i < pings.length; i++) {
    if (pings[i].simSerial !== lastSim) {
      swaps++;
      lastSim = pings[i].simSerial;
    }
  }

  return swaps;
}

function calculateRiskScore(factors: any[]): number {
  if (factors.length === 0) return 10; // Low risk baseline

  const totalWeight = factors.reduce((sum: number, f: any) => sum + f.weight, 0);
  const maxWeight = factors.length * 0.9;
  const normalizedScore = (totalWeight / maxWeight) * 100;

  return Math.min(Math.round(normalizedScore), 100);
}

function getRiskLevel(riskScore: number): string {
  if (riskScore >= 75) return "critical";
  if (riskScore >= 50) return "high";
  if (riskScore >= 25) return "medium";
  return "low";
}

function predictEvent(riskScore: number, factors: any[]): { event: string; confidence: number } {
  if (riskScore >= 75) {
    return { event: "theft", confidence: 0.8 };
  }
  if (riskScore >= 50) {
    return { event: "fraud", confidence: 0.6 };
  }
  if (riskScore >= 25) {
    return { event: "loss", confidence: 0.4 };
  }
  return { event: "none", confidence: 0.9 };
}

function generateRecommendations(riskLevel: string, factors: any[]): string[] {
  const recommendations: string[] = [];

  if (riskLevel === "critical") {
    recommendations.push("Immediately report device as stolen");
    recommendations.push("Contact local authorities");
    recommendations.push("Enable remote wipe if available");
  }

  if (riskLevel === "high") {
    recommendations.push("Monitor device location closely");
    recommendations.push("Review recent activity logs");
    recommendations.push("Consider reporting to authorities");
  }

  if (riskLevel === "medium") {
    recommendations.push("Keep device tracking enabled");
    recommendations.push("Review security settings");
  }

  const simSwapFactor = factors.find((f: any) => f.type === "sim_swap");
  if (simSwapFactor) {
    recommendations.push("Contact your mobile carrier immediately");
  }

  return recommendations;
}

// ── Anomaly Detection ───────────────────────────────────────────────────────────
export async function detectAnomaly(deviceId: string, pingData: any) {
  const device = await Device.findById(deviceId);
  if (!device) throw new Error("Device not found");

  // Get recent pings for baseline
  const recentPings = await Ping.find({ device: deviceId })
    .sort({ timestamp: -1 })
    .limit(50);

  if (recentPings.length < 5) {
    return null; // Not enough data for anomaly detection
  }

  const anomalies: any[] = [];

  // Check for impossible travel
  const travelAnomaly = checkImpossibleTravel(recentPings, pingData);
  if (travelAnomaly) {
    anomalies.push(travelAnomaly);
  }

  // Check for SIM swap
  const simSwapAnomaly = checkSimSwap(recentPings, pingData);
  if (simSwapAnomaly) {
    anomalies.push(simSwapAnomaly);
  }

  // Check for unusual hours
  const hoursAnomaly = checkUnusualHours(recentPings, pingData);
  if (hoursAnomaly) {
    anomalies.push(hoursAnomaly);
  }

  // Create anomaly records
  const anomalyRecords: any[] = [];
  for (const anomaly of anomalies) {
    const record = await AnomalyDetection.create({
      device: deviceId,
      imei: (device as any).imei,
      anomalyType: anomaly.type,
      severity: anomaly.severity,
      baselineData: anomaly.baseline,
      observedData: anomaly.observed,
      deviationScore: anomaly.deviation,
      location: {
        lat: pingData.lat,
        lng: pingData.lng,
      },
      timestamp: new Date(),
    });

    anomalyRecords.push(record);
  }

  return anomalyRecords;
}

function checkImpossibleTravel(recentPings: any[], newPing: any): any | null {
  const lastPing = recentPings[0];
  const timeDiff = (new Date(newPing.timestamp).getTime() - new Date(lastPing.timestamp).getTime()) / (1000 * 60 * 60); // hours
  const distance = haversineDistance(
    lastPing.lat,
    lastPing.lng,
    newPing.lat,
    newPing.lng
  );

  // Impossible if distance > 1000km in < 1 hour
  if (distance > 1000 && timeDiff < 1) {
    return {
      type: "impossible_travel",
      severity: "critical",
      baseline: { lastLocation: { lat: lastPing.lat, lng: lastPing.lng } },
      observed: { newLocation: { lat: newPing.lat, lng: newPing.lng }, distance, timeDiff },
      deviation: distance / timeDiff,
    };
  }

  return null;
}

function checkSimSwap(recentPings: any[], newPing: any): any | null {
  const lastPing = recentPings[0];

  if (newPing.simSerial && lastPing.simSerial && newPing.simSerial !== lastPing.simSerial) {
    return {
      type: "sim_swap",
      severity: "high",
      baseline: { lastSim: lastPing.simSerial },
      observed: { newSim: newPing.simSerial },
      deviation: 1.0,
    };
  }

  return null;
}

function checkUnusualHours(recentPings: any[], newPing: any): any | null {
  const hours = recentPings.map((p: any) => new Date(p.timestamp).getHours());
  const newHour = new Date(newPing.timestamp).getHours();

  const nightActivity = hours.filter((h: number) => h >= 0 && h < 6).length;
  const nightRatio = nightActivity / hours.length;

  // Unusual if new activity is at night and baseline is low night activity
  if (newHour >= 0 && newHour < 6 && nightRatio < 0.2) {
    return {
      type: "unusual_hours",
      severity: "medium",
      baseline: { nightRatio },
      observed: { hour: newHour },
      deviation: 1 - nightRatio,
    };
  }

  return null;
}

// ── Risk Prediction Retrieval ───────────────────────────────────────────────────
export async function getRiskPrediction(deviceId: string) {
  const prediction = await RiskPrediction.findOne({
    device: deviceId,
    validUntil: { $gte: new Date() },
  })
    .sort({ createdAt: -1 });

  return prediction;
}

export async function getRiskPredictionsByDevice(deviceId: string, limit = 10) {
  const predictions = await RiskPrediction.find({ device: deviceId })
    .sort({ createdAt: -1 })
    .limit(limit);

  return predictions;
}

// ── Anomaly Retrieval ───────────────────────────────────────────────────────────
export async function getAnomaliesByDevice(deviceId: string, limit = 20) {
  const anomalies = await AnomalyDetection.find({ device: deviceId })
    .sort({ timestamp: -1 })
    .limit(limit);

  return anomalies;
}

export async function getUnresolvedAnomalies(limit = 50) {
  const anomalies = await AnomalyDetection.find({ resolved: false })
    .populate("device", "imei make model")
    .sort({ timestamp: -1 })
    .limit(limit);

  return anomalies;
}

export async function resolveAnomaly(anomalyId: string, resolution: string) {
  const anomaly = await AnomalyDetection.findById(anomalyId);
  if (!anomaly) throw new Error("Anomaly not found");

  (anomaly as any).resolved = true;
  (anomaly as any).resolvedAt = new Date();
  (anomaly as any).resolution = resolution;
  await anomaly.save();

  return anomaly;
}

// ── Predictive Analytics Statistics ─────────────────────────────────────────────
export async function getPredictiveAnalyticsStatistics() {
  const [
    totalPredictions,
    criticalRisk,
    highRisk,
    mediumRisk,
    lowRisk,
    totalAnomalies,
    unresolvedAnomalies,
    criticalAnomalies,
  ] = await Promise.all([
    RiskPrediction.countDocuments(),
    RiskPrediction.countDocuments({ riskLevel: "critical" }),
    RiskPrediction.countDocuments({ riskLevel: "high" }),
    RiskPrediction.countDocuments({ riskLevel: "medium" }),
    RiskPrediction.countDocuments({ riskLevel: "low" }),
    AnomalyDetection.countDocuments(),
    AnomalyDetection.countDocuments({ resolved: false }),
    AnomalyDetection.countDocuments({ severity: "critical" }),
  ]);

  return {
    totalPredictions,
    criticalRisk,
    highRisk,
    mediumRisk,
    lowRisk,
    totalAnomalies,
    unresolvedAnomalies,
    criticalAnomalies,
  };
}
