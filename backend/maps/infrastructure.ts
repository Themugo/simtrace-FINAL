// ── Advanced Map Infrastructure ────────────────────────────────────────────────────
// Heatmaps, device density, theft clusters, polygon zones, live streams, moving trails

export interface MapPoint {
  lat: number;
  lng: number;
  value?: number;
  timestamp?: Date;
  deviceId?: string;
  type?: 'device' | 'theft' | 'recovery' | 'alert';
}

export interface HeatmapData {
  points: MapPoint[];
  intensity: number;
  radius: number;
}

export interface DeviceDensity {
  lat: number;
  lng: number;
  count: number;
  radius: number;
}

export interface TheftCluster {
  id: string;
  center: { lat: number; lng: number };
  points: MapPoint[];
  radius: number;
  theftCount: number;
  timeRange: { start: Date; end: Date };
}

export interface PolygonZone {
  id: string;
  name: string;
  type: 'safe' | 'danger' | 'restricted' | 'custom';
  coordinates: { lat: number; lng: number }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MovingTrail {
  deviceId: string;
  points: MapPoint[];
  startTime: Date;
  endTime: Date;
  color: string;
}

class MapInfrastructure {
  private heatmapData: HeatmapData[] = [];
  private deviceDensity: DeviceDensity[] = [];
  private theftClusters: TheftCluster[] = [];
  private polygonZones: Map<string, PolygonZone> = new Map();
  private movingTrails: Map<string, MovingTrail> = new Map();

  // Add point to heatmap
  addHeatmapPoint(point: MapPoint, intensity = 1, radius = 50): void {
    this.heatmapData.push({
      points: [point],
      intensity,
      radius,
    });
  }

  // Get heatmap data
  getHeatmapData(bounds?: { north: number; south: number; east: number; west: number }): HeatmapData[] {
    if (!bounds) return this.heatmapData;

    return this.heatmapData.filter(data => {
      return data.points.some(point =>
        point.lat >= bounds.south &&
        point.lat <= bounds.north &&
        point.lng >= bounds.west &&
        point.lng <= bounds.east
      );
    });
  }

  // Calculate device density
  calculateDeviceDensity(points: MapPoint[], gridSize = 0.01): DeviceDensity[] {
    const densityMap = new Map<string, number>();

    for (const point of points) {
      const gridLat = Math.floor(point.lat / gridSize) * gridSize;
      const gridLng = Math.floor(point.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      densityMap.set(key, (densityMap.get(key) || 0) + 1);
    }

    const density: DeviceDensity[] = [];

    for (const [key, count] of densityMap) {
      const [lat, lng] = key.split(',').map(Number);
      density.push({
        lat,
        lng,
        count,
        radius: gridSize * 111000, // Convert to meters (approximate)
      });
    }

    this.deviceDensity = density;
    return density;
  }

  // Get device density
  getDeviceDensity(): DeviceDensity[] {
    return this.deviceDensity;
  }

  // Detect theft clusters using DBSCAN
  detectTheftClusters(points: MapPoint[], epsilon = 0.01, minPts = 3): TheftCluster[] {
    const clusters: TheftCluster[] = [];
    const visited = new Set<string>();
    const noise: MapPoint[] = [];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      const key = `${point.lat},${point.lng}`;

      if (visited.has(key)) continue;
      visited.add(key);

      const neighbors = this.getNeighbors(point, points, epsilon);

      if (neighbors.length < minPts) {
        noise.push(point);
      } else {
        const clusterPoints = this.expandCluster(point, neighbors, points, epsilon, minPts, visited);
        
        if (clusterPoints.length >= minPts) {
          const center = this.calculateCenter(clusterPoints);
          const radius = this.calculateRadius(center, clusterPoints);

          clusters.push({
            id: `cluster_${clusters.length}`,
            center,
            points: clusterPoints,
            radius,
            theftCount: clusterPoints.length,
            timeRange: {
              start: new Date(Math.min(...clusterPoints.map(p => p.timestamp?.getTime() || 0))),
              end: new Date(Math.max(...clusterPoints.map(p => p.timestamp?.getTime() || Date.now()))),
            },
          });
        }
      }
    }

    this.theftClusters = clusters;
    return clusters;
  }

  // Get neighbors for DBSCAN
  private getNeighbors(point: MapPoint, points: MapPoint[], epsilon: number): MapPoint[] {
    return points.filter(p => this.calculateDistance(point.lat, point.lng, p.lat, p.lng) <= epsilon);
  }

  // Expand cluster for DBSCAN
  private expandCluster(
    point: MapPoint,
    neighbors: MapPoint[],
    points: MapPoint[],
    epsilon: number,
    minPts: number,
    visited: Set<string>
  ): MapPoint[] {
    const cluster = [point, ...neighbors];

    for (let i = 0; i < neighbors.length; i++) {
      const neighbor = neighbors[i];
      const key = `${neighbor.lat},${neighbor.lng}`;

      if (!visited.has(key)) {
        visited.add(key);
        const newNeighbors = this.getNeighbors(neighbor, points, epsilon);

        if (newNeighbors.length >= minPts) {
          neighbors.push(...newNeighbors.filter(n => !neighbors.includes(n)));
        }
      }

      if (!cluster.includes(neighbor)) {
        cluster.push(neighbor);
      }
    }

    return cluster;
  }

  // Calculate center of cluster
  private calculateCenter(points: MapPoint[]): { lat: number; lng: number } {
    const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
    return { lat: avgLat, lng: avgLng };
  }

  // Calculate radius of cluster
  private calculateRadius(center: { lat: number; lng: number }, points: MapPoint[]): number {
    const distances = points.map(p => this.calculateDistance(center.lat, center.lng, p.lat, p.lng));
    return Math.max(...distances);
  }

  // Get theft clusters
  getTheftClusters(): TheftCluster[] {
    return this.theftClusters;
  }

  // Add polygon zone
  addPolygonZone(zone: Omit<PolygonZone, 'id' | 'createdAt' | 'updatedAt'>): PolygonZone {
    const newZone: PolygonZone = {
      ...zone,
      id: `zone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.polygonZones.set(newZone.id, newZone);
    return newZone;
  }

  // Update polygon zone
  updatePolygonZone(zoneId: string, updates: Partial<Omit<PolygonZone, 'id' | 'createdAt'>>): PolygonZone | null {
    const zone = this.polygonZones.get(zoneId);
    if (!zone) return null;

    const updatedZone: PolygonZone = {
      ...zone,
      ...updates,
      updatedAt: new Date(),
    };

    this.polygonZones.set(zoneId, updatedZone);
    return updatedZone;
  }

  // Remove polygon zone
  removePolygonZone(zoneId: string): boolean {
    return this.polygonZones.delete(zoneId);
  }

  // Get polygon zone
  getPolygonZone(zoneId: string): PolygonZone | undefined {
    return this.polygonZones.get(zoneId);
  }

  // Get all polygon zones
  getAllPolygonZones(): PolygonZone[] {
    return Array.from(this.polygonZones.values());
  }

  // Check if point is inside polygon zone
  isPointInZone(point: { lat: number; lng: number }, zone: PolygonZone): boolean {
    return this.isPointInPolygon(point, zone.coordinates);
  }

  // Ray casting algorithm for point in polygon
  private isPointInPolygon(point: { lat: number; lng: number }, polygon: { lat: number; lng: number }[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;

      if (((yi > point.lat) !== (yj > point.lat)) &&
          (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Add moving trail
  addMovingTrail(trail: Omit<MovingTrail, 'deviceId'>): MovingTrail {
    const deviceId = trail.deviceId || `trail_${Date.now()}`;
    const newTrail: MovingTrail = {
      ...trail,
      deviceId,
    };

    this.movingTrails.set(deviceId, newTrail);
    return newTrail;
  }

  // Update moving trail
  updateMovingTrail(deviceId: string, point: MapPoint): MovingTrail | null {
    const trail = this.movingTrails.get(deviceId);
    if (!trail) return null;

    trail.points.push(point);
    trail.endTime = point.timestamp || new Date();

    return trail;
  }

  // Get moving trail
  getMovingTrail(deviceId: string): MovingTrail | undefined {
    return this.movingTrails.get(deviceId);
  }

  // Get all moving trails
  getAllMovingTrails(): MovingTrail[] {
    return Array.from(this.movingTrails.values());
  }

  // Remove moving trail
  removeMovingTrail(deviceId: string): boolean {
    return this.movingTrails.delete(deviceId);
  }

  // Clear old data
  clearOldData(maxAgeHours = 24): void {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;

    this.heatmapData = this.heatmapData.filter(data =>
      data.points.some(p => !p.timestamp || p.timestamp.getTime() > cutoff)
    );

    this.theftClusters = this.theftClusters.filter(cluster =>
      cluster.timeRange.end.getTime() > cutoff
    );

    for (const [deviceId, trail] of this.movingTrails) {
      if (trail.endTime.getTime() < cutoff) {
        this.movingTrails.delete(deviceId);
      }
    }
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

  // Get statistics
  getStatistics(): {
    totalHeatmapPoints: number;
    totalDensityPoints: number;
    totalTheftClusters: number;
    totalPolygonZones: number;
    totalMovingTrails: number;
  } {
    return {
      totalHeatmapPoints: this.heatmapData.reduce((sum, data) => sum + data.points.length, 0),
      totalDensityPoints: this.deviceDensity.length,
      totalTheftClusters: this.theftClusters.length,
      totalPolygonZones: this.polygonZones.size,
      totalMovingTrails: this.movingTrails.size,
    };
  }
}

// Singleton instance
export const mapInfrastructure = new MapInfrastructure();

// ── Convenience Functions ───────────────────────────────────────────────────────
export function addHeatmapPoint(point: MapPoint, intensity = 1, radius = 50): void {
  mapInfrastructure.addHeatmapPoint(point, intensity, radius);
}

export function getHeatmapData(bounds?: { north: number; south: number; east: number; west: number }): HeatmapData[] {
  return mapInfrastructure.getHeatmapData(bounds);
}

export function calculateDeviceDensity(points: MapPoint[], gridSize = 0.01): DeviceDensity[] {
  return mapInfrastructure.calculateDeviceDensity(points, gridSize);
}

export function getDeviceDensity(): DeviceDensity[] {
  return mapInfrastructure.getDeviceDensity();
}

export function detectTheftClusters(points: MapPoint[], epsilon = 0.01, minPts = 3): TheftCluster[] {
  return mapInfrastructure.detectTheftClusters(points, epsilon, minPts);
}

export function getTheftClusters(): TheftCluster[] {
  return mapInfrastructure.getTheftClusters();
}

export function addPolygonZone(zone: Omit<PolygonZone, 'id' | 'createdAt' | 'updatedAt'>): PolygonZone {
  return mapInfrastructure.addPolygonZone(zone);
}

export function updatePolygonZone(zoneId: string, updates: Partial<Omit<PolygonZone, 'id' | 'createdAt'>>): PolygonZone | null {
  return mapInfrastructure.updatePolygonZone(zoneId, updates);
}

export function removePolygonZone(zoneId: string): boolean {
  return mapInfrastructure.removePolygonZone(zoneId);
}

export function getPolygonZone(zoneId: string): PolygonZone | undefined {
  return mapInfrastructure.getPolygonZone(zoneId);
}

export function getAllPolygonZones(): PolygonZone[] {
  return mapInfrastructure.getAllPolygonZones();
}

export function isPointInZone(point: { lat: number; lng: number }, zone: PolygonZone): boolean {
  return mapInfrastructure.isPointInZone(point, zone);
}

export function addMovingTrail(trail: Omit<MovingTrail, 'deviceId'>): MovingTrail {
  return mapInfrastructure.addMovingTrail(trail);
}

export function updateMovingTrail(deviceId: string, point: MapPoint): MovingTrail | null {
  return mapInfrastructure.updateMovingTrail(deviceId, point);
}

export function getMovingTrail(deviceId: string): MovingTrail | undefined {
  return mapInfrastructure.getMovingTrail(deviceId);
}

export function getAllMovingTrails(): MovingTrail[] {
  return mapInfrastructure.getAllMovingTrails();
}

export function getMapStatistics() {
  return mapInfrastructure.getStatistics();
}
