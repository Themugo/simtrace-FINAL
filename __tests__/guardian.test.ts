import { describe, it, expect } from "vitest";
import { GuardianService } from "../services/guardian.service";

describe("Guardian Functionality & System User Integration", () => {
  const ownerId = "test-owner-999";

  it("requires guardians to be registered system users", () => {
    // Attempt non-existent system user
    const failRes = GuardianService.addGuardianFromSystemUser(ownerId, "non-existent-user", "SPOUSE");
    expect(failRes.success).toBe(false);
    expect(failRes.message).toContain("not a registered System User");

    // Add registered system user
    const res1 = GuardianService.addGuardianFromSystemUser(ownerId, "sys-usr-001", "SPOUSE");
    expect(res1.success).toBe(true);
    expect(res1.guardian?.systemUserId).toBe("sys-usr-001");
  });

  it("enforces a maximum limit of 3 guardians per device owner", () => {
    // Add 2nd
    const g2 = GuardianService.addGuardianFromSystemUser(ownerId, "sys-usr-002", "PARENT");
    expect(g2.success).toBe(true);

    // Add 3rd
    const g3 = GuardianService.addGuardianFromSystemUser(ownerId, "sys-usr-003", "LEGAL_GUARDIAN");
    expect(g3.success).toBe(true);

    // Attempt 4th - should fail due to Max 3 limit
    const g4 = GuardianService.addGuardianFromSystemUser(ownerId, "sys-usr-004", "TRUSTED_RELATIVE");
    expect(g4.success).toBe(false);
    expect(g4.message).toContain("Maximum guardian limit reached");
  });

  it("allows device owner to remove and replace a guardian at will", () => {
    const listBefore = GuardianService.getGuardiansForOwner(ownerId);
    expect(listBefore.length).toBe(3);

    const guardianToRemove = listBefore[0];
    const removed = GuardianService.removeGuardian(ownerId, guardianToRemove.id);
    expect(removed).toBe(true);

    const listAfter = GuardianService.getGuardiansForOwner(ownerId);
    expect(listAfter.length).toBe(2);

    // Can now add replacement
    const replacement = GuardianService.addGuardianFromSystemUser(ownerId, "sys-usr-004", "TRUSTED_RELATIVE");
    expect(replacement.success).toBe(true);
  });

  it("searches system user directory by National ID or System User ID", () => {
    const searchResult = GuardianService.searchSystemUsers("28190291");
    expect(searchResult.length).toBeGreaterThan(0);
    expect(searchResult[0].fullName).toBe("Sarah Jenkins");
  });

  it("triggers panic button alert and notifies guardians", () => {
    const alert = GuardianService.triggerPanicButton(
      ownerId,
      "Alexander Jenkins",
      "358992019921101"
    );

    expect(alert.id).toContain("panic-");
    expect(alert.status).toBe("TRIGGERED");

    const updated = GuardianService.updatePanicAlertStatus(alert.id, "ACKNOWLEDGED");
    expect(updated?.status).toBe("ACKNOWLEDGED");
  });

  it("allows guardians to report device lost or owner in danger", () => {
    const report = GuardianService.reportDeviceIncident(
      "g-101",
      "Sarah Jenkins",
      "358992019921101",
      "Alexander Jenkins",
      "OWNER_IN_DANGER",
      "Automated route deviation and uncontactable owner."
    );

    expect(report.id).toContain("inc-");
    expect(report.reportType).toBe("OWNER_IN_DANGER");
    expect(report.dispatchRef).toBeDefined();
  });

  it("allows guardian to register minor device on behalf with full autonomy", () => {
    const minorReg = GuardianService.registerMinorDevice("g-101", "Sarah Jenkins", {
      minorName: "Ethan Jenkins",
      minorAge: 14,
      deviceImei: "869123049182999",
      deviceModel: "Samsung Galaxy A54",
      carrier: "Safaricom 5G",
    });

    expect(minorReg.autonomyLevel).toBe("FULL_AUTONOMY");
    expect(minorReg.status).toBe("ACTIVE");

    // Autonomous control: Remote lock
    const locked = GuardianService.updateMinorDeviceStatus(minorReg.id, "REMOTE_LOCKED");
    expect(locked?.status).toBe("REMOTE_LOCKED");
  });
});
