export interface ContextRetrievalRequest {
  caseId?: string;
  entityId?: string;
  userId: string;
  organizationId: string;
}

export interface GroundedContextBundle {
  caseContext?: string;
  entityContext?: string;
  timelineContext?: string;
  userPermissions: string[];
  organizationRestrictions: string[];
  retrievedAt: string;
}

export class ContextBuilderService {
  public static buildContext(request: ContextRetrievalRequest): GroundedContextBundle {
    return {
      caseContext: request.caseId
        ? `Case #${request.caseId}: M-Pesa Telecom Fraud Syndicate active in Nairobi CBD.`
        : "General Case Directory Context",
      entityContext: request.entityId
        ? `Entity #${request.entityId}: Samsung S24 Ultra linked to 3 SIM swaps on Safaricom.`
        : "Multi-Carrier Telemetry Entity Context",
      timelineContext: "CDR logs & cell tower handovers from 2026-08-01 00:00 to present.",
      userPermissions: ["CASE_VIEW", "EVIDENCE_READ", "COPILOT_INTERACT", "EXPORT_REPORT"],
      organizationRestrictions: ["SOVEREIGN_KE_RESTRICTION", "RESTRICTED_EXPORT_CJIS"],
      retrievedAt: new Date().toISOString(),
    };
  }
}
