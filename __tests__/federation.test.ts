import { describe, it, expect } from "vitest";
import { FederationService } from "../services/federation.service";

describe("Phase 17: National-Scale Federation & Cross-Organization Collaboration", () => {
  it("retrieves active trust relationships and allows adding new trust relationships", () => {
    const initialTrusts = FederationService.getTrustRelationships();
    expect(initialTrusts.length).toBeGreaterThan(0);

    const newTrust = FederationService.createTrustRelationship({
      requestingOrganizationId: "org-police-01",
      targetOrganizationId: "org-bank-central-01",
      targetOrganizationName: "Central Bank Financial Intelligence Unit",
      trustLevel: "EXTENDED",
      status: "ACTIVE",
      effectiveDate: "2026-08-01T00:00:00Z",
      expirationDate: "2027-08-01T00:00:00Z",
      approvedBy: "Central Bank Governor",
    });

    expect(newTrust.id).toContain("tr-");
    expect(FederationService.getTrustRelationships().length).toBe(initialTrusts.length);
  });

  it("manages Data Sharing Agreements (DSAs) backed by legal basis", () => {
    const dsas = FederationService.getDataSharingAgreements();
    expect(dsas.length).toBeGreaterThan(0);
    expect(dsas[0].legalBasis).toBeDefined();

    const newDsa = FederationService.createDataSharingAgreement({
      organizationId: "org-police-01",
      partnerOrganizationId: "org-bank-central-01",
      partnerOrganizationName: "Central Bank Financial Intelligence Unit",
      agreementType: "EVIDENCE_SHARING",
      permittedResources: ["SWIFT Wire Log Telemetry", "High-Risk Account Alerts"],
      legalBasis: "Anti-Money Laundering Act 2020 Sec 12",
      expirationDate: "2027-08-01T00:00:00Z",
      status: "ACTIVE",
    });

    expect(newDsa.id).toContain("dsa-");
  });

  it("performs federated entity search across trusted partner organizations", () => {
    const results = FederationService.searchFederatedEntities("869123049182341");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].provenance).toBeDefined();
    expect(results[0].visibilityLevel).toBeDefined();
  });

  it("manages cross-organization data requests and approval workflows", () => {
    const reqs = FederationService.getDataRequests();
    expect(reqs.length).toBeGreaterThan(0);

    const newReq = FederationService.submitDataRequest({
      requesterOrgId: "org-police-01",
      requesterOrgName: "Kenya National Police",
      targetOrgId: "org-safaricom-01",
      targetOrgName: "Safaricom Fraud Operations",
      requestedResource: "Tower CDR Handovers",
      purpose: "Investigate suspect IMEI flight route",
      legalBasis: "Search Warrant #SW-2026-109",
    });

    expect(newReq.status).toBe("PENDING_REVIEW");

    const approved = FederationService.updateDataRequestStatus(newReq.id, "APPROVED", "Director CID");
    expect(approved?.status).toBe("APPROVED");
    expect(approved?.grantedUntil).toBeDefined();
  });

  it("evaluates policy rules for cross-organization resource access", () => {
    const evaluation = FederationService.evaluatePolicy(
      "org-safaricom-01",
      "org-police-01",
      "M-Pesa CDR Telemetry"
    );

    expect(evaluation.allowed).toBe(true);
    expect(evaluation.reason).toContain("Access granted under DSA");
  });

  it("updates complianceAuditCount and adjusts dynamic trust level based on audit findings", () => {
    const trust = FederationService.getTrustRelationships()[0];
    const initialAudits = trust.complianceAuditCount;
    expect(initialAudits).toBeGreaterThan(0);

    const updated = FederationService.recordSecurityAudit(trust.id, 5);
    expect(updated?.complianceAuditCount).toBe(initialAudits + 1);

    const evaluation = FederationService.calculateDynamicTrustLevel(updated!);
    expect(evaluation.effectiveTrustLevel).toBe("LIMITED");
    expect(evaluation.auditStatus).toBe("CRITICAL_ISSUES");
  });
});
