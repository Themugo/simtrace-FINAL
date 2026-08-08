import { describe, it, expect } from "vitest";
import { GeointService } from "../services/geoint.service";

describe("Phase 15: Geospatial Intelligence, Digital Twin, Route Reconstruction & Heatmaps", () => {
  it("logs location events and retrieves telemetry by entity ID", () => {
    const event = GeointService.logLocationEvent({
      entityId: "imei-test-999",
      organizationId: "org-police-01",
      latitude: -1.286389,
      longitude: 36.817223,
      accuracy: 5,
      timestamp: "2026-08-03T10:00:00Z",
      source: "GPS_MOBILE",
    });

    expect(event.id).toContain("loc-");
    const retrieved = GeointService.getLocationEvents("imei-test-999");
    expect(retrieved.length).toBeGreaterThan(0);
    expect(retrieved[0].latitude).toBe(-1.286389);
  });

  it("reconstructs historical route with waypoints, stops, and distance calculations", () => {
    const route = GeointService.reconstructRoute("imei-869123049182341");
    expect(route.entityId).toBe("imei-869123049182341");
    expect(route.pointCount).toBeGreaterThan(0);
    expect(route.totalDistanceKm).toBeGreaterThan(0);
    expect(route.waypoints.length).toBeGreaterThan(0);
  });

  it("compares multi-entity routes for spatial proximity and overlap", () => {
    const comparison = GeointService.compareRoutes("imei-869123049182341", "msisdn-254712345678");
    expect(comparison.entityA).toBe("imei-869123049182341");
    expect(comparison.closestApproachMeters).toBeGreaterThanOrEqual(0);
    expect(comparison.similarityScorePercent).toBeGreaterThan(0);
  });

  it("manages sovereign geofence zones and handles new geofence creation", () => {
    const initialCount = GeointService.getGeofences().length;
    const newGf = GeointService.createGeofence({
      organizationId: "org-police-01",
      name: "State House Perimeter",
      type: "CIRCLE",
      centerLat: -1.2789,
      centerLng: 36.8142,
      radiusMeters: 1000,
      rules: ["ENTER", "EXIT"],
      riskLevel: "CRITICAL",
    });

    expect(newGf.id).toContain("gf-");
    expect(GeointService.getGeofences().length).toBe(initialCount + 1);
  });

  it("generates digital twin state snapshots for cases", () => {
    const snapshot = GeointService.getDigitalTwinSnapshot("CASE-KE-2026-0891");
    expect(snapshot.caseId).toBe("CASE-KE-2026-0891");
    expect(snapshot.activeEntities.length).toBeGreaterThan(0);
    expect(snapshot.snapshotId).toContain("dt-");
  });
});
