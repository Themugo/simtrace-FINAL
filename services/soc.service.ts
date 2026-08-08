export type AlertSeverity = "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type AlertStatus = "NEW" | "INVESTIGATING" | "MITIGATED" | "DISMISSED";

export interface SecurityAlert {
  id: string;
  type: "FAILED_LOGIN_SPIKE" | "SUSPICIOUS_API_USAGE" | "PRIVILEGE_CHANGE" | "UNAUTHORIZED_ACCESS_ATTEMPT" | "ABNORMAL_TRAFFIC";
  severity: AlertSeverity;
  source: string;
  organizationId?: string;
  description: string;
  status: AlertStatus;
  createdAt: string;
}

const SECURITY_ALERTS_STORE: SecurityAlert[] = [
  {
    id: "sec-001",
    type: "FAILED_LOGIN_SPIKE",
    severity: "HIGH",
    source: "Authentication Gatekeeper (196.201.214.12)",
    organizationId: "org-police-01",
    description: "Detected 48 failed password attempts within 60 seconds targeting user inspector.doe@nps.go.ke.",
    status: "INVESTIGATING",
    createdAt: "2026-08-01T01:14:00Z",
  },
  {
    id: "sec-002",
    type: "UNAUTHORIZED_ACCESS_ATTEMPT",
    severity: "CRITICAL",
    source: "Tenant Isolation Middleware",
    organizationId: "org-telecom-02",
    description: "Attempted cross-tenant evidence query targeting case-ke-2026-0891 without valid organization authorization token.",
    status: "MITIGATED",
    createdAt: "2026-08-01T00:45:00Z",
  },
  {
    id: "sec-003",
    type: "PRIVILEGE_CHANGE",
    severity: "MEDIUM",
    source: "RBAC Governance Engine",
    organizationId: "org-police-01",
    description: "User role for sergeant.smith@nps.go.ke escalated from ANALYST to CASE_MANAGER by Admin Officer.",
    status: "NEW",
    createdAt: "2026-07-31T22:10:00Z",
  },
];

export class SecurityOperationsService {
  public static getAlerts(filterStatus?: AlertStatus): SecurityAlert[] {
    if (filterStatus) {
      return SECURITY_ALERTS_STORE.filter((a) => a.status === filterStatus);
    }
    return SECURITY_ALERTS_STORE;
  }

  public static createAlert(params: {
    type: SecurityAlert["type"];
    severity: AlertSeverity;
    source: string;
    organizationId?: string;
    description: string;
  }): SecurityAlert {
    const alert: SecurityAlert = {
      id: `sec-${Date.now()}`,
      type: params.type,
      severity: params.severity,
      source: params.source,
      organizationId: params.organizationId,
      description: params.description,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    SECURITY_ALERTS_STORE.unshift(alert);
    return alert;
  }

  public static updateAlertStatus(id: string, status: AlertStatus): SecurityAlert {
    const alert = SECURITY_ALERTS_STORE.find((a) => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    alert.status = status;
    return alert;
  }

  public static getSystemHealthStatus(): {
    status: "HEALTHY" | "DEGRADED" | "CRITICAL";
    uptimeSeconds: number;
    dbConnections: number;
    redisLatencyMs: number;
    activeSocketConnections: number;
    lastBackupTimestamp: string;
  } {
    return {
      status: "HEALTHY",
      uptimeSeconds: 1489020,
      dbConnections: 34,
      redisLatencyMs: 1.2,
      activeSocketConnections: 128,
      lastBackupTimestamp: new Date(Date.now() - 3600000).toISOString(),
    };
  }
}
