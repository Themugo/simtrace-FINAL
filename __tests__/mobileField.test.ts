import { describe, it, expect } from "vitest";
import { MobileFieldService } from "../services/mobileField.service";

describe("Phase 11: Mobile Field Operations, Offline Intelligence & Global Strategy", () => {
  it("registers mobile devices and tracks platform trust status", () => {
    const dev = MobileFieldService.registerDevice({
      userId: "user-agent-x",
      deviceId: "Pixel8Pro_KE_901",
      platform: "ANDROID",
      model: "Google Pixel 8 Pro",
      osVersion: "Android 15",
      trusted: true,
    });

    expect(dev.id).toContain("dev-mob-");
    expect(dev.platform).toBe("ANDROID");

    const devices = MobileFieldService.getRegisteredDevices("user-agent-x");
    expect(devices.length).toBe(1);
    expect(devices[0].model).toBe("Google Pixel 8 Pro");
  });

  it("buffers offline actions in sync queue and processes sync on reconnection", () => {
    const userId = "user-inspect-doe";
    const queuedItem = MobileFieldService.queueOfflineAction(userId, "CREATE_NOTE", {
      caseId: "case-999",
      note: "Offline suspect interview transcript",
    });

    expect(queuedItem.status).toBe("PENDING");

    const syncResult = MobileFieldService.processSyncQueue(userId);
    expect(syncResult.processedCount).toBeGreaterThan(0);
    expect(queuedItem.status).toBe("SYNCED");
  });

  it("captures mobile evidence with SHA-256 chain of custody and GPS EXIF metadata", () => {
    const ev = MobileFieldService.captureMobileEvidence({
      caseId: "case-ke-2026-0891",
      capturedBy: "Inspector John Doe",
      mediaType: "PHOTO",
      fileUrl: "s3://evidence-bucket/crime_scene.jpg",
      sha256Hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      gpsCoordinates: { latitude: -1.286389, longitude: 36.817223, accuracyMeters: 2.1 },
      deviceModel: "iPhone 15 Pro",
    });

    expect(ev.id).toContain("ev-mob-");
    expect(ev.gpsCoordinates.latitude).toBe(-1.286389);
    expect(ev.sha256Hash).toHaveLength(64);

    const caseEv = MobileFieldService.getEvidenceCaptures("case-ke-2026-0891");
    expect(caseEv.length).toBeGreaterThan(0);
  });

  it("manages field tactical teams and regional compliance profiles", () => {
    const teams = MobileFieldService.getFieldTeams();
    expect(teams.length).toBeGreaterThan(0);
    expect(teams[0].status).toBe("ON_DUTY");

    const regions = MobileFieldService.getRegionalSettings();
    expect(regions.length).toBeGreaterThanOrEqual(3);
    expect(regions.some((r) => r.countryCode === "KE")).toBe(true);
  });
});
