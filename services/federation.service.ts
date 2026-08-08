export type TrustLevel = "NONE" | "LIMITED" | "STANDARD" | "EXTENDED" | "CUSTOM";

export interface TrustRelationship {
  id: string;
  requestingOrganizationId: string;
  targetOrganizationId: string;
  targetOrganizationName: string;
  trustLevel: TrustLevel;
  status: "PENDING" | "ACTIVE" | "SUSPENDED" | "EXPIRED";
  effectiveDate: string;
  expirationDate: string;
  approvedBy?: string;
  createdAt: string;
  complianceAuditCount: number;
  recentAuditFindingsCount?: number;
}

export interface DataSharingAgreement {
  id: string;
  organizationId: string;
  partnerOrganizationId: string;
  partnerOrganizationName: string;
  agreementType: "CASE_SHARING" | "EVIDENCE_SHARING" | "ENTITY_SHARING" | "ALERT_SHARING" | "API_INTEGRATION";
  permittedResources: string[];
  legalBasis: string; // e.g., "Mutual Legal Assistance Treaty (MLAT) Ref #881"
  expirationDate: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt: string;
}

export interface DataRequest {
  id: string;
  requesterOrgId: string;
  requesterOrgName: string;
  targetOrgId: string;
  targetOrgName: string;
  requestedResource: string;
  purpose: string;
  legalBasis: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "EXPIRED";
  grantedUntil?: string;
  reviewedBy?: string;
  createdAt: string;
}

export interface FederatedSearchResult {
  entityId: string;
  entityType: "IMEI" | "MSISDN" | "SUSPECT" | "CASE";
  sourceOrgId: string;
  sourceOrgName: string;
  matchScore: number;
  visibilityLevel: "FULL" | "REDACTED" | "CONFIRMATION_ONLY";
  provenance: string;
  snippet: string;
}

// In-Memory Data Stores
const TRUST_RELATIONSHIPS_STORE: TrustRelationship[] = [
  {
    id: "tr-001",
    requestingOrganizationId: "org-police-01",
    targetOrganizationId: "org-safaricom-01",
    targetOrganizationName: "Safaricom Fraud Operations",
    trustLevel: "EXTENDED",
    status: "ACTIVE",
    effectiveDate: "2026-01-01T00:00:00Z",
    expirationDate: "2027-01-01T00:00:00Z",
    approvedBy: "Inspector General of Police",
    createdAt: "2026-01-01T00:00:00Z",
    complianceAuditCount: 14,
    recentAuditFindingsCount: 0,
  },
  {
    id: "tr-002",
    requestingOrganizationId: "org-police-01",
    targetOrganizationId: "org-interpol-01",
    targetOrganizationName: "INTERPOL East Africa Bureau",
    trustLevel: "STANDARD",
    status: "ACTIVE",
    effectiveDate: "2026-03-15T00:00:00Z",
    expirationDate: "2026-12-31T00:00:00Z",
    approvedBy: "Director CID",
    createdAt: "2026-03-15T00:00:00Z",
    complianceAuditCount: 8,
    recentAuditFindingsCount: 2,
  },
];

const DATA_SHARING_AGREEMENTS_STORE: DataSharingAgreement[] = [
  {
    id: "dsa-101",
    organizationId: "org-police-01",
    partnerOrganizationId: "org-safaricom-01",
    partnerOrganizationName: "Safaricom Fraud Operations",
    agreementType: "CASE_SHARING",
    permittedResources: ["M-Pesa CDR Telemetry", "SIM Swap Records", "Cell Tower Coordinates"],
    legalBasis: "Kenyan Cybercrime Act 2018 Sec 34 Court Order",
    expirationDate: "2027-01-01T00:00:00Z",
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const DATA_REQUESTS_STORE: DataRequest[] = [
  {
    id: "req-201",
    requesterOrgId: "org-safaricom-01",
    requesterOrgName: "Safaricom Fraud Operations",
    targetOrgId: "org-police-01",
    targetOrgName: "Kenya National Police",
    requestedResource: "Case #102 Suspect Forensic Tower Logs",
    purpose: "Cross-verify SIM Swap syndicate cell handovers in Nairobi CBD",
    legalBasis: "Data Protection Act 2019 Fraud Exemption",
    status: "PENDING_REVIEW",
    createdAt: "2026-08-03T09:00:00Z",
  },
];

export class FederationService {
  /**
   * Calculates dynamic trust level based on recent security audit findings
   */
  public static calculateDynamicTrustLevel(trust: TrustRelationship): {
    effectiveTrustLevel: TrustLevel;
    auditStatus: "PASSED" | "WARNING" | "CRITICAL_ISSUES";
  } {
    const findings = trust.recentAuditFindingsCount ?? 0;
    if (trust.status !== "ACTIVE") {
      return { effectiveTrustLevel: "NONE", auditStatus: "CRITICAL_ISSUES" };
    }
    if (findings >= 4) {
      return { effectiveTrustLevel: "LIMITED", auditStatus: "CRITICAL_ISSUES" };
    }
    if (findings >= 2) {
      return { effectiveTrustLevel: "STANDARD", auditStatus: "WARNING" };
    }
    return { effectiveTrustLevel: trust.trustLevel, auditStatus: "PASSED" };
  }

  /**
   * Record new security audit check for partner organization
   */
  public static recordSecurityAudit(relationshipId: string, findingsCount: number): TrustRelationship | null {
    const target = TRUST_RELATIONSHIPS_STORE.find((t) => t.id === relationshipId);
    if (!target) return null;
    target.complianceAuditCount += 1;
    target.recentAuditFindingsCount = findingsCount;
    return target;
  }

  /**
   * Get active trust relationships
   */
  public static getTrustRelationships(): TrustRelationship[] {
    return TRUST_RELATIONSHIPS_STORE;
  }

  /**
   * Request or create trust relationship
   */
  public static createTrustRelationship(
    rel: Omit<TrustRelationship, "id" | "createdAt" | "complianceAuditCount"> & { complianceAuditCount?: number }
  ): TrustRelationship {
    const newRel: TrustRelationship = {
      ...rel,
      complianceAuditCount: rel.complianceAuditCount ?? 1,
      recentAuditFindingsCount: rel.recentAuditFindingsCount ?? 0,
      id: `tr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    TRUST_RELATIONSHIPS_STORE.unshift(newRel);
    return newRel;
  }

  /**
   * Get active Data Sharing Agreements (DSAs)
   */
  public static getDataSharingAgreements(): DataSharingAgreement[] {
    return DATA_SHARING_AGREEMENTS_STORE;
  }

  /**
   * Create new Data Sharing Agreement
   */
  public static createDataSharingAgreement(dsa: Omit<DataSharingAgreement, "id" | "createdAt">): DataSharingAgreement {
    const newDsa: DataSharingAgreement = {
      ...dsa,
      id: `dsa-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    DATA_SHARING_AGREEMENTS_STORE.unshift(newDsa);
    return newDsa;
  }

  /**
   * Perform Federated Search across trusted partner organizations
   */
  public static searchFederatedEntities(query: string): FederatedSearchResult[] {
    if (!query.trim()) return [];

    return [
      {
        entityId: "imei-869123049182341",
        entityType: "IMEI",
        sourceOrgId: "org-safaricom-01",
        sourceOrgName: "Safaricom Fraud Operations",
        matchScore: 0.98,
        visibilityLevel: "FULL",
        provenance: "Safaricom CDR Database (DSA #dsa-101 Active)",
        snippet: "Samsung S24 Ultra associated with 3 unauthorized SIM swaps in Nairobi.",
      },
      {
        entityId: "msisdn-254712345678",
        entityType: "MSISDN",
        sourceOrgId: "org-interpol-01",
        sourceOrgName: "INTERPOL East Africa Bureau",
        matchScore: 0.85,
        visibilityLevel: "REDACTED",
        provenance: "INTERPOL Red Notice Database (Trust Level: STANDARD)",
        snippet: "Target phone number flagged in cross-border money laundering investigation.",
      },
    ];
  }

  /**
   * Get Data Requests
   */
  public static getDataRequests(): DataRequest[] {
    return DATA_REQUESTS_STORE;
  }

  /**
   * Submit new Data Request
   */
  public static submitDataRequest(req: Omit<DataRequest, "id" | "status" | "createdAt">): DataRequest {
    const newReq: DataRequest = {
      ...req,
      id: `req-${Date.now()}`,
      status: "PENDING_REVIEW",
      createdAt: new Date().toISOString(),
    };
    DATA_REQUESTS_STORE.unshift(newReq);
    return newReq;
  }

  /**
   * Approve or Reject Data Request
   */
  public static updateDataRequestStatus(
    requestId: string,
    status: "APPROVED" | "REJECTED",
    reviewer: string
  ): DataRequest | null {
    const target = DATA_REQUESTS_STORE.find((r) => r.id === requestId);
    if (!target) return null;

    target.status = status;
    target.reviewedBy = reviewer;
    if (status === "APPROVED") {
      // Grant access for 30 days
      const expire = new Date();
      expire.setDate(expire.getDate() + 30);
      target.grantedUntil = expire.toISOString();
    }
    return target;
  }

  /**
   * Evaluate Policy Engine permission check
   */
  public static evaluatePolicy(
    requestorOrgId: string,
    targetOrgId: string,
    resourceType: string
  ): { allowed: boolean; reason: string } {
    const trust = TRUST_RELATIONSHIPS_STORE.find(
      (t) =>
        (t.requestingOrganizationId === requestorOrgId && t.targetOrganizationId === targetOrgId) ||
        (t.requestingOrganizationId === targetOrgId && t.targetOrganizationId === requestorOrgId)
    );

    if (!trust || trust.status !== "ACTIVE") {
      return { allowed: false, reason: "No active trust relationship exists between organizations." };
    }

    const dsa = DATA_SHARING_AGREEMENTS_STORE.find(
      (d) => d.organizationId === targetOrgId && d.partnerOrganizationId === requestorOrgId && d.status === "ACTIVE"
    );

    if (!dsa) {
      return { allowed: false, reason: "Trust relationship exists, but no active Data Sharing Agreement (DSA) governs this resource." };
    }

    return { allowed: true, reason: `Access granted under DSA #${dsa.id} (${dsa.legalBasis}).` };
  }
}
