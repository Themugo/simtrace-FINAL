export interface ExternalIntegration {
  id: string;
  organizationId: string;
  name: string;
  category: "TELECOM" | "SECURITY_SIEM" | "GOVERNMENT_DB" | "CRM" | "ANALYTICS";
  provider: string;
  status: "CONNECTED" | "DISCONNECTED" | "ERROR";
  lastSyncAt?: string;
  config: Record<string, any>;
}

export interface AppDirectoryListing {
  id: string;
  name: string;
  developer: string;
  category: "Security" | "Analytics" | "Telecom" | "Compliance" | "Automation";
  description: string;
  installed: boolean;
  iconName: string;
}

export interface BulkDataImportJob {
  id: string;
  organizationId: string;
  type: "DEVICE_TELEMETRY" | "CASE_EVIDENCE" | "SUBSCRIBER_PROFILES";
  fileName: string;
  recordsProcessed: number;
  duplicateCount: number;
  errorCount: number;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
}

const INTEGRATIONS_STORE: ExternalIntegration[] = [
  {
    id: "int-1",
    organizationId: "org-police-01",
    name: "Safaricom Core Network Telemetry Feed",
    category: "TELECOM",
    provider: "Safaricom Enterprise API",
    status: "CONNECTED",
    lastSyncAt: "2026-08-01T02:00:00Z",
    config: { endpoint: "https://api.safaricom.co.ke/v2/telemetry", rateLimitRps: 500 },
  },
  {
    id: "int-2",
    organizationId: "org-police-01",
    name: "Splunk Enterprise SIEM Connector",
    category: "SECURITY_SIEM",
    provider: "Splunk HEC",
    status: "CONNECTED",
    lastSyncAt: "2026-08-01T01:45:00Z",
    config: { hecUrl: "https://splunk.nps.go.ke:8088/services/collector", index: "simtrace_audit" },
  },
];

const MARKETPLACE_STORE: AppDirectoryListing[] = [
  { id: "app-1", name: "Splunk SIEM Forwarder", developer: "SimTrace Enterprise", category: "Security", description: "Stream real-time audit logs and SIM swap security alerts directly into Splunk indexers.", installed: true, iconName: "Shield" },
  { id: "app-2", name: "Safaricom Core Tower Ingestion", developer: "Safaricom Telecom", category: "Telecom", description: "High-throughput cell tower triangulation and subscriber lookup connector.", installed: true, iconName: "Radio" },
  { id: "app-3", name: "Interpol Stolen Device Registry", developer: "Interpol Security", category: "Compliance", description: "Automated IMEI blacklist synchronization with global stolen mobile databases.", installed: false, iconName: "Globe" },
  { id: "app-4", name: "IBM QRadar Security Sync", developer: "IBM Security", category: "Security", description: "Bi-directional threat intelligence exchange for enterprise security operations centers.", installed: false, iconName: "Cpu" },
];

const DATA_IMPORTS_STORE: BulkDataImportJob[] = [
  {
    id: "imp-101",
    organizationId: "org-police-01",
    type: "DEVICE_TELEMETRY",
    fileName: "nairobi_tower_dumps_20260731.csv",
    recordsProcessed: 148200,
    duplicateCount: 1420,
    errorCount: 0,
    status: "COMPLETED",
    createdAt: "2026-07-31T23:00:00Z",
  },
];

export class IntegrationService {
  public static getIntegrations(organizationId: string): ExternalIntegration[] {
    return INTEGRATIONS_STORE.filter((i) => i.organizationId === organizationId);
  }

  public static getMarketplaceApps(): AppDirectoryListing[] {
    return MARKETPLACE_STORE;
  }

  public static getImportJobs(organizationId: string): BulkDataImportJob[] {
    return DATA_IMPORTS_STORE.filter((j) => j.organizationId === organizationId);
  }

  public static runBulkImport(
    organizationId: string,
    type: BulkDataImportJob["type"],
    fileName: string,
    rawRecordsCount: number
  ): BulkDataImportJob {
    const job: BulkDataImportJob = {
      id: `imp-${Date.now()}`,
      organizationId,
      type,
      fileName,
      recordsProcessed: rawRecordsCount,
      duplicateCount: Math.floor(rawRecordsCount * 0.02),
      errorCount: 0,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };
    DATA_IMPORTS_STORE.unshift(job);
    return job;
  }
}
