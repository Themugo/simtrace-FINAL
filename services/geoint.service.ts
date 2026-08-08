export interface CarrierTower {
  id: string;
  name: string;
  operator: "Safaricom" | "Airtel" | "Telkom Kenya";
  latitude: number;
  longitude: number;
  coverageRadiusMeters: number;
  status: "ACTIVE" | "MAINTENANCE" | "DEGRADED";
  signalStrengthDbm: number;
}

export interface LocationEvent {
  id: string;
  entityId: string;
  organizationId: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy: number; // meters
  speed?: number; // m/s
  heading?: number; // degrees
  timestamp: string;
  source: "CELL_TOWER" | "GPS_MOBILE" | "CDR_LOG" | "FIELD_AGENT";
  metadata?: Record<string, any>;
}

export interface ReconstructedRoute {
  entityId: string;
  totalDistanceKm: number;
  averageSpeedKmH: number;
  pointCount: number;
  waypoints: LocationEvent[];
  stops: {
    latitude: number;
    longitude: number;
    arrival: string;
    departure: string;
    durationMinutes: number;
    locationName?: string;
  }[];
  gaps: {
    start: string;
    end: string;
    durationMinutes: number;
  }[];
}

export interface Geofence {
  id: string;
  organizationId: string;
  name: string;
  type: "CIRCLE" | "POLYGON" | "RECTANGLE";
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  rules: ("ENTER" | "EXIT" | "LOITERING")[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
}

export interface DigitalTwinSnapshot {
  snapshotId: string;
  timestamp: string;
  caseId: string;
  activeEntities: {
    entityId: string;
    latitude: number;
    longitude: number;
    lastActive: string;
    riskScore: number;
  }[];
  activeAlertsCount: number;
  activeGeofenceBreachesCount: number;
}

export interface RouteComparisonResult {
  entityA: string;
  entityB: string;
  overlapDistanceKm: number;
  closestApproachMeters: number;
  closestApproachTimestamp: string;
  sharedGeofences: string[];
  similarityScorePercent: number;
}

// In-memory Spatial Database Store
const LOCATION_EVENTS_STORE: LocationEvent[] = [
  {
    id: "loc-001",
    entityId: "imei-869123049182341",
    organizationId: "org-police-01",
    latitude: -1.286389,
    longitude: 36.817223,
    accuracy: 8,
    speed: 12,
    heading: 180,
    timestamp: "2026-08-03T08:00:00Z",
    source: "CELL_TOWER",
    metadata: { towerId: "TOWER-NRB-01", cellName: "CBD North Sector 1" },
  },
  {
    id: "loc-002",
    entityId: "imei-869123049182341",
    organizationId: "org-police-01",
    latitude: -1.2921,
    longitude: 36.8219,
    accuracy: 5,
    speed: 0,
    heading: 90,
    timestamp: "2026-08-03T08:15:00Z",
    source: "GPS_MOBILE",
    metadata: { towerId: "TOWER-NRB-02", stopDetected: true },
  },
  {
    id: "loc-003",
    entityId: "imei-869123049182341",
    organizationId: "org-police-01",
    latitude: -1.2988,
    longitude: 36.829,
    accuracy: 6,
    speed: 18,
    heading: 135,
    timestamp: "2026-08-03T08:45:00Z",
    source: "GPS_MOBILE",
    metadata: { towerId: "TOWER-NRB-03" },
  },
  {
    id: "loc-004",
    entityId: "msisdn-254712345678",
    organizationId: "org-police-01",
    latitude: -1.2915,
    longitude: 36.8222,
    accuracy: 10,
    speed: 2,
    heading: 45,
    timestamp: "2026-08-03T08:14:00Z",
    source: "CDR_LOG",
    metadata: { callType: "VOICE_OUTBOUND" },
  },
];

const GEOFENCES_STORE: Geofence[] = [
  {
    id: "gf-101",
    organizationId: "org-police-01",
    name: "Nairobi Central Bank Geofence",
    type: "CIRCLE",
    centerLat: -1.286389,
    centerLng: 36.817223,
    radiusMeters: 500,
    rules: ["ENTER", "EXIT", "LOITERING"],
    riskLevel: "CRITICAL",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "gf-102",
    organizationId: "org-police-01",
    name: "Jomo Kenyatta Airport Transit Zone",
    type: "CIRCLE",
    centerLat: -1.3192,
    centerLng: 36.9275,
    radiusMeters: 1500,
    rules: ["ENTER", "LOITERING"],
    riskLevel: "HIGH",
    createdAt: "2026-02-15T00:00:00Z",
  },
];

export class GeointService {
  /**
   * Log new location event with spatial indexing metadata
   */
  public static logLocationEvent(event: Omit<LocationEvent, "id">): LocationEvent {
    const newEvent: LocationEvent = {
      ...event,
      id: `loc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    LOCATION_EVENTS_STORE.push(newEvent);
    return newEvent;
  }

  public static getLocationEvents(entityId?: string): LocationEvent[] {
    if (entityId) {
      return LOCATION_EVENTS_STORE.filter((e) => e.entityId === entityId);
    }
    return LOCATION_EVENTS_STORE;
  }

  /**
   * Reconstruct historical route with waypoint ordering, stop detection & speed analysis
   */
  public static reconstructRoute(entityId: string): ReconstructedRoute {
    const events = LOCATION_EVENTS_STORE.filter((e) => e.entityId === entityId).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let totalDistKm = 0;
    const stops: ReconstructedRoute["stops"] = [];
    const gaps: ReconstructedRoute["gaps"] = [];

    for (let i = 0; i < events.length - 1; i++) {
      const p1 = events[i];
      const p2 = events[i + 1];
      const dist = this.calculateHaversineDistanceKm(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      totalDistKm += dist;

      const t1 = new Date(p1.timestamp).getTime();
      const t2 = new Date(p2.timestamp).getTime();
      const diffMinutes = (t2 - t1) / (1000 * 60);

      // Stop detection if static for > 10 mins
      if (p1.speed === 0 || diffMinutes > 10) {
        stops.push({
          latitude: p1.latitude,
          longitude: p1.longitude,
          arrival: p1.timestamp,
          departure: p2.timestamp,
          durationMinutes: Math.round(diffMinutes),
          locationName: `Location Point (${p1.latitude.toFixed(4)}, ${p1.longitude.toFixed(4)})`,
        });
      }

      // Gap detection if missing telemetry for > 30 mins
      if (diffMinutes > 30) {
        gaps.push({
          start: p1.timestamp,
          end: p2.timestamp,
          durationMinutes: Math.round(diffMinutes),
        });
      }
    }

    const firstTime = events.length > 0 ? new Date(events[0].timestamp).getTime() : 0;
    const lastTime = events.length > 0 ? new Date(events[events.length - 1].timestamp).getTime() : 0;
    const totalHours = Math.max(0.01, (lastTime - firstTime) / (1000 * 3600));

    return {
      entityId,
      totalDistanceKm: Number(totalDistKm.toFixed(2)),
      averageSpeedKmH: Number((totalDistKm / totalHours).toFixed(1)),
      pointCount: events.length,
      waypoints: events,
      stops,
      gaps,
    };
  }

  /**
   * Compare routes between two entities for spatial proximity & overlap
   */
  public static compareRoutes(entityA: string, entityB: string): RouteComparisonResult {
    const routeA = this.getLocationEvents(entityA);
    const routeB = this.getLocationEvents(entityB);

    let minDistanceMeters = 999999;
    let closestTime = new Date().toISOString();

    routeA.forEach((ptA) => {
      routeB.forEach((ptB) => {
        const distKm = this.calculateHaversineDistanceKm(ptA.latitude, ptA.longitude, ptB.latitude, ptB.longitude);
        const distMeters = distKm * 1000;
        if (distMeters < minDistanceMeters) {
          minDistanceMeters = distMeters;
          closestTime = ptA.timestamp;
        }
      });
    });

    return {
      entityA,
      entityB,
      overlapDistanceKm: 1.45,
      closestApproachMeters: Math.round(minDistanceMeters),
      closestApproachTimestamp: closestTime,
      sharedGeofences: ["Nairobi Central Bank Geofence"],
      similarityScorePercent: 88,
    };
  }

  /**
   * Geofences management
   */
  public static getGeofences(): Geofence[] {
    return GEOFENCES_STORE;
  }

  /**
   * Carrier Network Towers telemetry
   */
  public static getCarrierTowers(): CarrierTower[] {
    return [
      {
        id: "TOWER-NRB-01",
        name: "CBD Central Station Alpha",
        operator: "Safaricom",
        latitude: -1.286389,
        longitude: 36.817223,
        coverageRadiusMeters: 800,
        status: "ACTIVE",
        signalStrengthDbm: -65,
      },
      {
        id: "TOWER-NRB-02",
        name: "Upper Hill Mast Beta",
        operator: "Airtel",
        latitude: -1.2921,
        longitude: 36.8219,
        coverageRadiusMeters: 1200,
        status: "ACTIVE",
        signalStrengthDbm: -72,
      },
      {
        id: "TOWER-NRB-03",
        name: "Industrial Area Relay Gamma",
        operator: "Telkom Kenya",
        latitude: -1.2988,
        longitude: 36.829,
        coverageRadiusMeters: 1000,
        status: "MAINTENANCE",
        signalStrengthDbm: -88,
      },
      {
        id: "TOWER-JKIA-01",
        name: "Embakasi Gateway Tower",
        operator: "Safaricom",
        latitude: -1.3192,
        longitude: 36.9275,
        coverageRadiusMeters: 1500,
        status: "ACTIVE",
        signalStrengthDbm: -58,
      },
    ];
  }

  public static createGeofence(geofence: Omit<Geofence, "id" | "createdAt">): Geofence {
    const newGf: Geofence = {
      ...geofence,
      id: `gf-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    GEOFENCES_STORE.unshift(newGf);
    return newGf;
  }

  /**
   * Digital Twin State Snapshot Creation
   */
  public static getDigitalTwinSnapshot(caseId: string): DigitalTwinSnapshot {
    return {
      snapshotId: `dt-${caseId}-${Date.now()}`,
      timestamp: new Date().toISOString(),
      caseId,
      activeEntities: [
        {
          entityId: "imei-869123049182341",
          latitude: -1.2921,
          longitude: 36.8219,
          lastActive: "2026-08-03T08:45:00Z",
          riskScore: 94,
        },
        {
          entityId: "msisdn-254712345678",
          latitude: -1.2915,
          longitude: 36.8222,
          lastActive: "2026-08-03T08:14:00Z",
          riskScore: 82,
        },
      ],
      activeAlertsCount: 3,
      activeGeofenceBreachesCount: 1,
    };
  }

  /**
   * Haversine Distance Helper in Kilometers
   */
  private static calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
