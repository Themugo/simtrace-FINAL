export type DataClassificationLevel = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED" | "HIGHLY_RESTRICTED";

export interface OrganizationPolicy {
  id: string;
  organizationId: string;
  policyType: "ACCESS_POLICY" | "DATA_RETENTION_POLICY" | "SECURITY_POLICY" | "EXPORT_POLICY" | "DEVICE_POLICY";
  name: string;
  configuration: Record<string, any>;
  enabled: boolean;
  createdAt: string;
}

export interface DataClassification {
  id: string;
  resourceType: "CASE" | "EVIDENCE" | "REPORT" | "ENTITY" | "DOCUMENT" | "EXPORT";
  resourceId: string;
  classificationLevel: DataClassificationLevel;
  createdBy: string;
  createdAt: string;
}

export interface PrivacyRequest {
  id: string;
  organizationId: string;
  requestType: "DATA_ACCESS" | "DATA_EXPORT" | "DATA_CORRECTION" | "DATA_DELETION";
  requestedBy: string;
  subjectIdentity: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
  createdAt: string;
  completedAt?: string;
}

export interface RetentionPolicy {
  id: string;
  organizationId: string;
  resourceType: string;
  retentionPeriodDays: number;
  action: "ARCHIVE" | "DELETE" | "ANONYMIZE";
  createdAt: string;
}

export interface ComplianceEvent {
  id: string;
  organizationId: string;
  eventType: "PERMISSION_CHANGE" | "EVIDENCE_ACCESS" | "REPORT_EXPORT" | "FAILED_AUTH" | "ADMIN_ACTION" | "PRIVACY_REQUEST";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  description: string;
  actor: string;
  status: "LOGGED" | "UNDER_REVIEW" | "RESOLVED";
  createdAt: string;
}

export interface AuditCase {
  id: string;
  organizationId: string;
  title: string;
  auditorId: string;
  auditorName: string;
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "FAILED";
  scope: string;
  findingsCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface AccessReview {
  id: string;
  organizationId: string;
  reviewerId: string;
  reviewerName: string;
  targetRole: string;
  usersReviewedCount: number;
  revokedCount: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "APPROVED" | "FLAGGED";
  createdAt: string;
}

export interface LegalDocument {
  id: string;
  organizationId: string;
  type: "TERMS" | "PRIVACY_POLICY" | "DATA_AGREEMENT" | "ENTERPRISE_CONTRACT";
  title: string;
  version: string;
  status: "DRAFT" | "EFFECTIVE" | "SUPERSEDED";
  effectiveDate: string;
  createdAt: string;
}

export interface SecurityIncident {
  id: string;
  organizationId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  status: "OPEN" | "INVESTIGATING" | "CONTAINED" | "RESOLVED";
  assignedTo: string;
  detectedAt: string;
  resolvedAt?: string;
}

const ORGANIZATION_POLICIES_STORE: OrganizationPolicy[] = [
  {
    id: "pol-001",
    organizationId: "org-police-01",
    policyType: "ACCESS_POLICY",
    name: "Zero-Trust MFA & Biometric Session Enforcer",
    configuration: { mfaRequired: true, sessionMaxMinutes: 30, maxFailedLogins: 3 },
    enabled: true,
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "pol-002",
    organizationId: "org-police-01",
    policyType: "EXPORT_POLICY",
    name: "High-Classification Forensic Export Approval Requirement",
    configuration: { restrictRestrictedExports: true, requireDualOfficerApproval: true },
    enabled: true,
    createdAt: "2026-02-01T00:00:00Z",
  },
  {
    id: "pol-003",
    organizationId: "org-police-01",
    policyType: "DATA_RETENTION_POLICY",
    name: "Kenya Data Protection Act Telecom Auto-Purge Policy",
    configuration: { retainDays: 365, action: "ANONYMIZE" },
    enabled: true,
    createdAt: "2026-03-10T00:00:00Z",
  },
];

const DATA_CLASSIFICATIONS_STORE: DataClassification[] = [
  {
    id: "cls-001",
    resourceType: "CASE",
    resourceId: "case-ke-2026-0891",
    classificationLevel: "HIGHLY_RESTRICTED",
    createdBy: "System Security Engine",
    createdAt: "2026-08-01T00:00:00Z",
  },
  {
    id: "cls-002",
    resourceType: "EVIDENCE",
    resourceId: "ev-mob-901",
    classificationLevel: "RESTRICTED",
    createdBy: "Inspector John Doe",
    createdAt: "2026-08-01T01:15:00Z",
  },
];

const PRIVACY_REQUESTS_STORE: PrivacyRequest[] = [
  {
    id: "prv-req-101",
    organizationId: "org-police-01",
    requestType: "DATA_EXPORT",
    requestedBy: "Citizen DPO Inquiry #KE-9921",
    subjectIdentity: "MSISDN +254711223344",
    status: "PROCESSING",
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "prv-req-102",
    organizationId: "org-police-01",
    requestType: "DATA_DELETION",
    requestedBy: "Legal Rep - Obsoleted Suspect Record",
    subjectIdentity: "IMEI 869123049182341",
    status: "COMPLETED",
    createdAt: "2026-07-28T14:20:00Z",
    completedAt: "2026-07-29T09:10:00Z",
  },
];

const RETENTION_POLICIES_STORE: RetentionPolicy[] = [
  {
    id: "ret-pol-01",
    organizationId: "org-police-01",
    resourceType: "TOWER_DUMP_LOGS",
    retentionPeriodDays: 180,
    action: "ANONYMIZE",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "ret-pol-02",
    organizationId: "org-police-01",
    resourceType: "CLOSED_CASE_EVIDENCE",
    retentionPeriodDays: 3650, // 10 years
    action: "ARCHIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
];

const COMPLIANCE_EVENTS_STORE: ComplianceEvent[] = [
  {
    id: "cmp-evt-801",
    organizationId: "org-police-01",
    eventType: "EVIDENCE_ACCESS",
    severity: "MEDIUM",
    description: "Inspector Doe accessed Restricted Case Evidence #ev-mob-901",
    actor: "user-inspect-doe",
    status: "LOGGED",
    createdAt: "2026-08-01T11:05:00Z",
  },
  {
    id: "cmp-evt-802",
    organizationId: "org-police-01",
    eventType: "FAILED_AUTH",
    severity: "HIGH",
    description: "Multiple failed MFA biometric attempts from untrusted IP 197.232.12.5",
    actor: "unknown-external",
    status: "UNDER_REVIEW",
    createdAt: "2026-08-01T12:30:00Z",
  },
];

const AUDIT_CASES_STORE: AuditCase[] = [
  {
    id: "aud-case-2026-01",
    organizationId: "org-police-01",
    title: "SOC 2 Type II Annual Security & Isolation Audit",
    auditorId: "auditor-kpmg-01",
    auditorName: "Senior Compliance Specialist (KPMG)",
    status: "ACTIVE",
    scope: "Multi-tenant database isolation, SIM swap telemetry, export trails",
    findingsCount: 1,
    createdAt: "2026-07-15T00:00:00Z",
  },
  {
    id: "aud-case-2026-02",
    organizationId: "org-police-01",
    title: "Kenya DPA 2019 Quarterly Privacy Compliance Review",
    auditorId: "auditor-dpa-ke",
    auditorName: "National Data Protection Auditor",
    status: "COMPLETED",
    scope: "Subscriber PII masking, consent records, subscriber lookup logs",
    findingsCount: 0,
    createdAt: "2026-06-01T00:00:00Z",
    completedAt: "2026-06-10T00:00:00Z",
  },
];

const ACCESS_REVIEWS_STORE: AccessReview[] = [
  {
    id: "acc-rev-301",
    organizationId: "org-police-01",
    reviewerId: "admin-sec-head",
    reviewerName: "Director of Security Ops",
    targetRole: "SUPER_ADMIN & FIELD_INVESTIGATOR",
    usersReviewedCount: 42,
    revokedCount: 3,
    status: "APPROVED",
    createdAt: "2026-07-01T00:00:00Z",
  },
];

const LEGAL_DOCUMENTS_STORE: LegalDocument[] = [
  {
    id: "leg-doc-01",
    organizationId: "org-police-01",
    type: "ENTERPRISE_CONTRACT",
    title: "Sovereign Intelligence SaaS Service Level & Compliance Agreement",
    version: "v4.2",
    status: "EFFECTIVE",
    effectiveDate: "2026-01-01",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "leg-doc-02",
    organizationId: "org-police-01",
    type: "DATA_AGREEMENT",
    title: "Cross-Border Telecom Telemetry Data Processing Agreement (DPA)",
    version: "v2.0",
    status: "EFFECTIVE",
    effectiveDate: "2026-03-15",
    createdAt: "2026-03-15T00:00:00Z",
  },
];

const SECURITY_INCIDENTS_STORE: SecurityIncident[] = [
  {
    id: "inc-2026-901",
    organizationId: "org-police-01",
    severity: "MEDIUM",
    title: "Unusual Rate Spike in Export Requests on SIM Swap Graph",
    description: "Automated anomaly detection flagged 15 export calls in 2 minutes from User Sgt Smith.",
    status: "INVESTIGATING",
    assignedTo: "Chief Information Security Officer",
    detectedAt: "2026-08-01T08:15:00Z",
  },
  {
    id: "inc-2026-880",
    organizationId: "org-police-01",
    severity: "LOW",
    title: "Stale API Key Revocation Delay",
    description: "DevOps service account API key expired but remained in memory cache for 12 minutes.",
    status: "RESOLVED",
    assignedTo: "DevOps Lead",
    detectedAt: "2026-07-20T11:00:00Z",
    resolvedAt: "2026-07-20T11:25:00Z",
  },
];

export class ComplianceGovernanceService {
  public static getPolicies(orgId?: string): OrganizationPolicy[] {
    if (orgId) {
      return ORGANIZATION_POLICIES_STORE.filter((p) => p.organizationId === orgId);
    }
    return ORGANIZATION_POLICIES_STORE;
  }

  public static togglePolicy(policyId: string): OrganizationPolicy | undefined {
    const pol = ORGANIZATION_POLICIES_STORE.find((p) => p.id === policyId);
    if (pol) {
      pol.enabled = !pol.enabled;
    }
    return pol;
  }

  public static getClassifications(): DataClassification[] {
    return DATA_CLASSIFICATIONS_STORE;
  }

  public static setClassification(params: Omit<DataClassification, "id" | "createdAt">): DataClassification {
    const cls: DataClassification = {
      ...params,
      id: `cls-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    DATA_CLASSIFICATIONS_STORE.unshift(cls);
    return cls;
  }

  public static getPrivacyRequests(): PrivacyRequest[] {
    return PRIVACY_REQUESTS_STORE;
  }

  public static createPrivacyRequest(params: Omit<PrivacyRequest, "id" | "status" | "createdAt">): PrivacyRequest {
    const req: PrivacyRequest = {
      ...params,
      id: `prv-req-${Date.now()}`,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };
    PRIVACY_REQUESTS_STORE.unshift(req);
    return req;
  }

  public static processPrivacyRequest(id: string, status: PrivacyRequest["status"]): PrivacyRequest | undefined {
    const req = PRIVACY_REQUESTS_STORE.find((r) => r.id === id);
    if (req) {
      req.status = status;
      if (status === "COMPLETED" || status === "REJECTED") {
        req.completedAt = new Date().toISOString();
      }
    }
    return req;
  }

  public static getRetentionPolicies(): RetentionPolicy[] {
    return RETENTION_POLICIES_STORE;
  }

  public static getComplianceEvents(): ComplianceEvent[] {
    return COMPLIANCE_EVENTS_STORE;
  }

  public static logComplianceEvent(params: Omit<ComplianceEvent, "id" | "createdAt">): ComplianceEvent {
    const evt: ComplianceEvent = {
      ...params,
      id: `cmp-evt-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    COMPLIANCE_EVENTS_STORE.unshift(evt);
    return evt;
  }

  public static getAuditCases(): AuditCase[] {
    return AUDIT_CASES_STORE;
  }

  public static createAuditCase(params: Omit<AuditCase, "id" | "findingsCount" | "createdAt">): AuditCase {
    const audit: AuditCase = {
      ...params,
      id: `aud-case-${Date.now()}`,
      findingsCount: 0,
      createdAt: new Date().toISOString(),
    };
    AUDIT_CASES_STORE.unshift(audit);
    return audit;
  }

  public static getAccessReviews(): AccessReview[] {
    return ACCESS_REVIEWS_STORE;
  }

  public static getLegalDocuments(): LegalDocument[] {
    return LEGAL_DOCUMENTS_STORE;
  }

  public static getSecurityIncidents(): SecurityIncident[] {
    return SECURITY_INCIDENTS_STORE;
  }

  public static createSecurityIncident(params: Omit<SecurityIncident, "id" | "detectedAt">): SecurityIncident {
    const inc: SecurityIncident = {
      ...params,
      id: `inc-${Date.now()}`,
      detectedAt: new Date().toISOString(),
    };
    SECURITY_INCIDENTS_STORE.unshift(inc);
    return inc;
  }

  public static getComplianceMetrics() {
    const openIncidents = SECURITY_INCIDENTS_STORE.filter((i) => i.status !== "RESOLVED").length;
    const pendingPrivacyReqs = PRIVACY_REQUESTS_STORE.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").length;
    const activeAudits = AUDIT_CASES_STORE.filter((a) => a.status === "ACTIVE").length;
    const enabledPolicies = ORGANIZATION_POLICIES_STORE.filter((p) => p.enabled).length;

    return {
      securityScore: 96,
      openIncidents,
      pendingPrivacyReqs,
      activeAudits,
      enabledPolicies,
      totalPolicies: ORGANIZATION_POLICIES_STORE.length,
      soc2CompliancePercent: 100,
      gdprCompliancePercent: 98,
    };
  }
}
