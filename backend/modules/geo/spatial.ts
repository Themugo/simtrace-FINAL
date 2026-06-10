// ── Geospatial Intelligence Engine ───────────────────────────────────────────────────
// Spatial clustering, route prediction, and geo correlation

import { DeviceLocation } from '../../db/index.js';

export interface LocationPoint {
  lat: number;
  lng: number;
  timestamp?: Date;
  imei?: string;
}

export interface Cluster {
  id: string;
  center: { lat: number; lng: number };
  points: LocationPoint[];
  radius: number;
  count: number;
}

export interface RoutePrediction {
  imei: string;
  predictedLocations: Array<{
    lat: number;
    lng: number;
    probability: number;
    estimatedTime: Date;
  }>;
  confidence: number;
}

export interface GeoCorrelation {
  devices: string[];
  locations: LocationPoint[];
  correlationScore: number;
  pattern: string;
}

// ── Spatial Clustering (DBSCAN-like algorithm) ───────────────────────────────────
export function detectSpatialClusters(
  points: LocationPoint[],
  epsilon = 0.01, // ~1km in degrees
  minPoints = 3
): Cluster[] {
  const clusters: Cluster[] = [];
  const visited = new Set<string>();
  const noise: LocationPoint[] = [];

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const key = `${point.lat},${point.lng}`;

    if (visited.has(key)) continue;
    visited.add(key);

    const neighbors = getNeighbors(point, points, epsilon);

    if (neighbors.length < minPoints) {
      noise.push(point);
    } else {
      const cluster = expandCluster(point, neighbors, points, visited, epsilon, minPoints);
      clusters.push(cluster);
    }
  }

  return clusters;
}

function getNeighbors(point: LocationPoint, points: LocationPoint[], epsilon: number): LocationPoint[] {
  return points.filter(p => {
    const distance = haversineDistance(point.lat, point.lng, p.lat, p.lng);
    return distance <= epsilon;
  });
}

function expandCluster(
  point: LocationPoint,
  neighbors: LocationPoint[],
  points: LocationPoint[],
  visited: Set<string>,
  epsilon: number,
  minPoints: number
): Cluster {
  const clusterPoints: LocationPoint[] = [point];
  const queue = [...neighbors];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const key = `${current.lat},${current.lng}`;

    if (!visited.has(key)) {
      visited.add(key);
      const currentNeighbors = getNeighbors(current, points, epsilon);

      if (currentNeighbors.length >= minPoints) {
        queue.push(...currentNeighbors);
      }
    }

    if (!clusterPoints.some(p => p.lat === current.lat && p.lng === current.lng)) {
      clusterPoints.push(current);
    }
  }

  // Calculate cluster center and radius
  const center = calculateCenter(clusterPoints);
  const radius = calculateRadius(center, clusterPoints);

  return {
    id: `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    center,
    points: clusterPoints,
    radius,
    count: clusterPoints.length,
  };
}

function calculateCenter(points: LocationPoint[]): { lat: number; lng: number } {
  const sumLat = points.reduce((sum, p) => sum + p.lat, 0);
  const sumLng = points.reduce((sum, p) => sum + p.lng, 0);
  return {
    lat: sumLat / points.length,
    lng: sumLng / points.length,
  };
}

function calculateRadius(center: { lat: number; lng: number }, points: LocationPoint[]): number {
  const distances = points.map(p => haversineDistance(center.lat, center.lng, p.lat, p.lng));
  return Math.max(...distances);
}

// ── Route Prediction ─────────────────────────────────────────────────────────────
export async function predictRoute(imei: string, hoursAhead = 24): Promise<RoutePrediction> {
  // Get historical locations for this device
  const historicalLocations = await DeviceLocation.find({ imei })
    .sort({ timestamp: -1 })
    .limit(100);

  if (historicalLocations.length < 5) {
    return {
      imei,
      predictedLocations: [],
      confidence: 0,
    };
  }

  // Extract movement patterns
  const patterns = extractMovementPatterns(historicalLocations);

  // Predict next locations based on patterns
  const predictions = patterns.map(pattern => {
    const lastLocation = historicalLocations[0];
    const predictedLat = lastLocation.lat + pattern.avgDeltaLat;
    const predictedLng = lastLocation.lng + pattern.avgDeltaLng;
    const estimatedTime = new Date(Date.now() + pattern.avgTimeDelta * hoursAhead);

    return {
      lat: predictedLat,
      lng: predictedLng,
      probability: pattern.frequency,
      estimatedTime,
    };
  });

  // Calculate confidence based on pattern consistency
  const confidence = calculatePatternConfidence(patterns);

  return {
    imei,
    predictedLocations: predictions,
    confidence,
  };
}

interface MovementPattern {
  avgDeltaLat: number;
  avgDeltaLng: number;
  avgTimeDelta: number;
  frequency: number;
}

function extractMovementPatterns(locations: Array<{ lat: number; lng: number; timestamp: Date }>): MovementPattern[] {
  const patterns: MovementPattern[] = [];

  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i];
    const curr = locations[i - 1];

    const deltaLat = curr.lat - prev.lat;
    const deltaLng = curr.lng - prev.lng;
    const timeDelta = new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime();

    patterns.push({
      avgDeltaLat: deltaLat,
      avgDeltaLng: deltaLng,
      avgTimeDelta: timeDelta,
      frequency: 1,
    });
  }

  // Group similar patterns
  const groupedPatterns = groupSimilarPatterns(patterns);

  return groupedPatterns;
}

function groupSimilarPatterns(patterns: MovementPattern[]): MovementPattern[] {
  const grouped: MovementPattern[] = [];
  const threshold = 0.0001; // ~10 meters in degrees

  for (const pattern of patterns) {
    let found = false;

    for (const group of grouped) {
      const latDiff = Math.abs(pattern.avgDeltaLat - group.avgDeltaLat);
      const lngDiff = Math.abs(pattern.avgDeltaLng - group.avgDeltaLng);

      if (latDiff < threshold && lngDiff < threshold) {
        // Merge into existing group
        group.avgDeltaLat = (group.avgDeltaLat * group.frequency + pattern.avgDeltaLat) / (group.frequency + 1);
        group.avgDeltaLng = (group.avgDeltaLng * group.frequency + pattern.avgDeltaLng) / (group.frequency + 1);
        group.avgTimeDelta = (group.avgTimeDelta * group.frequency + pattern.avgTimeDelta) / (group.frequency + 1);
        group.frequency += 1;
        found = true;
        break;
      }
    }

    if (!found) {
      grouped.push({ ...pattern });
    }
  }

  return grouped;
}

function calculatePatternConfidence(patterns: MovementPattern[]): number {
  if (patterns.length === 0) return 0;

  const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
  const maxFrequency = Math.max(...patterns.map(p => p.frequency));

  return maxFrequency / totalFrequency;
}

// ── Geo Correlation ─────────────────────────────────────────────────────────────
export async function findGeoCorrelations(
  imei: string,
  radiusKm = 5,
  timeWindowHours = 24
): Promise<GeoCorrelation[]> {
  const deviceLocations = await DeviceLocation.find({ imei })
    .sort({ timestamp: -1 })
    .limit(50);

  if (deviceLocations.length === 0) return [];

  const correlations: GeoCorrelation[] = [];

  for (const location of deviceLocations) {
    // Find other devices near this location within time window
    const timeWindow = new Date(location.timestamp.getTime() - timeWindowHours * 60 * 60 * 1000);

    const nearbyDevices = await DeviceLocation.find({
      imei: { $ne: imei },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat],
          },
          $maxDistance: radiusKm * 1000, // Convert to meters
        },
      },
      timestamp: { $gte: timeWindow },
    }).limit(20);

    if (nearbyDevices.length > 0) {
      const uniqueDevices = [...new Set(nearbyDevices.map(d => d.imei))];

      correlations.push({
        devices: uniqueDevices,
        locations: nearbyDevices.map(d => ({
          lat: d.lat,
          lng: d.lng,
          timestamp: d.timestamp,
          imei: d.imei,
        })),
        correlationScore: calculateCorrelationScore(uniqueDevices.length, nearbyDevices.length),
        pattern: detectPattern(nearbyDevices),
      });
    }
  }

  return correlations;
}

function calculateCorrelationScore(uniqueDevices: number, totalPoints: number): number {
  // Higher score when more unique devices are correlated
  return uniqueDevices / Math.max(totalPoints, 1);
}

function detectPattern(locations: Array<{ lat: number; lng: number; timestamp: Date; imei?: string }>): string {
  // Analyze movement pattern
  if (locations.length < 2) return 'insufficient_data';

  const directions = [];
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i];
    const curr = locations[i - 1];
    const bearing = calculateBearing(prev.lat, prev.lng, curr.lat, curr.lng);
    directions.push(bearing);
  }

  // Check if movement is directional
  const avgBearing = directions.reduce((sum, d) => sum + d, 0) / directions.length;
  const variance = directions.reduce((sum, d) => sum + Math.pow(d - avgBearing, 2), 0) / directions.length;

  if (variance < 30) return 'directional_movement';
  if (variance > 150) return 'random_movement';
  return 'clustered_activity';
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

// ── Helper Functions ─────────────────────────────────────────────────────────────
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

// ── Theft Hotspot Detection ───────────────────────────────────────────────────────
export async function detectTheftHotspots(
  region: { lat: number; lng: number; radiusKm: number },
  timeWindowDays = 30
): Promise<Cluster[]> {
  const startDate = new Date(Date.now() - timeWindowDays * 24 * 60 * 60 * 1000);

  // Get all device theft reports in region
  const theftLocations = await DeviceLocation.find({
    timestamp: { $gte: startDate },
    location: {
      $geoWithin: {
        $centerSphere: [[region.lng, region.lat], region.radiusKm / 6371],
      },
    },
  });

  const points: LocationPoint[] = theftLocations.map(loc => ({
    lat: loc.lat,
    lng: loc.lng,
    timestamp: loc.timestamp,
    imei: loc.imei,
  }));

  return detectSpatialClusters(points, 0.005, 5); // ~500m clusters, min 5 points
}

// ── Device Congregation Detection ────────────────────────────────────────────────
export async function detectDeviceCongregation(
  center: { lat: number; lng: number },
  radiusKm = 1,
  minDevices = 10
): Promise<{ imei: string; location: LocationPoint }[]> {
  const nearbyDevices = await DeviceLocation.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [center.lng, center.lat],
        },
        $maxDistance: radiusKm * 1000,
      },
    },
  }).limit(100);

  if (nearbyDevices.length < minDevices) return [];

  return nearbyDevices.map(d => ({
    imei: d.imei,
    location: {
      lat: d.lat,
      lng: d.lng,
      timestamp: d.timestamp,
    },
  }));
}
