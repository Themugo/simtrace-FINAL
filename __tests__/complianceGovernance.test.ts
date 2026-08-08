import { describe, it, expect } from "vitest";
import { ComplianceGovernanceService } from "../services/complianceGovernance.service";

describe("Phase 12: Global Compliance, Enterprise Governance & Trust Framework", () => {
  it("fetches and manages enterprise organization policies", () => {
    const policies = ComplianceGovernanceService.getPolicies("org-police-01");
    expect(policies.length).toBeGreaterThan(0);
    expect(policies[0].policyType).toBe("ACCESS_POLICY");

    const initialStatus = policies[0].enabled;
    const toggled = ComplianceGovernanceService.togglePolicy(policies[0].id);
    expect(toggled?.enabled).toBe(!initialStatus);

    // Revert for consistency
    ComplianceGovernanceService.togglePolicy(policies[0].id);
  });

  it("handles privacy requests (Data Export & Deletion) according to GDPR/DPA rules", () => {
    const newReq = ComplianceGovernanceService.createPrivacyRequest({
      organizationId: "org-police-01",
      requestType: "DATA_EXPORT",
      requestedBy: "Data Protection Officer",
      subjectIdentity: "Phone +254700000000",
    });

    expect(newReq.id).toContain("prv-req-");
    expect(newReq.status).toBe("PENDING");

    const updated = ComplianceGovernanceService.processPrivacyRequest(newReq.id, "COMPLETED");
    expect(updated?.status).toBe("COMPLETED");
    expect(updated?.completedAt).toBeDefined();
  });

  it("logs compliance audit events and maintains incident escalation workflows", () => {
    const evt = ComplianceGovernanceService.logComplianceEvent({
      organizationId: "org-police-01",
      eventType: "EVIDENCE_ACCESS",
      severity: "HIGH",
      description: "Unauthorized bulk evidence export attempted",
      actor: "user-test",
      status: "LOGGED",
    });

    expect(evt.id).toContain("cmp-evt-");
    const allEvts = ComplianceGovernanceService.getComplianceEvents();
    expect(allEvts.some((e) => e.id === evt.id)).toBe(true);

    const inc = ComplianceGovernanceService.createSecurityIncident({
      organizationId: "org-police-01",
      severity: "HIGH",
      title: "Suspicious API token usage",
      description: "Token used from unexpected geo location",
      status: "OPEN",
      assignedTo: "SecOps Lead",
    });

    expect(inc.id).toContain("inc-");
    expect(inc.status).toBe("OPEN");
  });

  it("calculates accurate enterprise compliance readiness metrics", () => {
    const metrics = ComplianceGovernanceService.getComplianceMetrics();
    expect(metrics.securityScore).toBeGreaterThanOrEqual(90);
    expect(metrics.soc2CompliancePercent).toBe(100);
    expect(metrics.gdprCompliancePercent).toBeGreaterThanOrEqual(90);
  });
});
