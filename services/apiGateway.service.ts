export interface ApiKeyRecord {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  keyHash: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export interface ApiUsageLog {
  id: string;
  organizationId: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  timestamp: string;
}

const API_KEYS_STORE: ApiKeyRecord[] = [
  {
    id: "key-101",
    organizationId: "org-police-01",
    name: "NPS Telemetry Ingest Key",
    keyPrefix: "st_live_89a1",
    keyHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    permissions: ["devices.track", "devices.search", "cases.read", "intelligence.graph.read"],
    lastUsedAt: "2026-08-01T02:15:00Z",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "key-102",
    organizationId: "org-police-01",
    name: "Automated SIEM Alert Integration",
    keyPrefix: "st_live_44c2",
    keyHash: "f7fbba6e0636f890e56fbbf3283e524c6fa320d401d69a6ad60cf42e200906f6",
    permissions: ["webhooks.manage", "reports.generate"],
    lastUsedAt: "2026-07-31T18:30:00Z",
    createdAt: "2026-03-10T00:00:00Z",
  },
];

const USAGE_LOGS_STORE: ApiUsageLog[] = [
  { id: "log-1", organizationId: "org-police-01", apiKeyId: "key-101", endpoint: "/api/v1/devices/IMEI86420912/track", method: "POST", statusCode: 200, responseTimeMs: 42, timestamp: "2026-08-01T02:15:00Z" },
  { id: "log-2", organizationId: "org-police-01", apiKeyId: "key-101", endpoint: "/api/v1/intelligence/graph", method: "GET", statusCode: 200, responseTimeMs: 115, timestamp: "2026-08-01T02:10:00Z" },
  { id: "log-3", organizationId: "org-police-01", apiKeyId: "key-102", endpoint: "/api/v1/reports/generate", method: "POST", statusCode: 201, responseTimeMs: 240, timestamp: "2026-07-31T18:30:00Z" },
];

export class ApiGatewayService {
  public static getApiKeys(organizationId: string): ApiKeyRecord[] {
    return API_KEYS_STORE.filter((k) => k.organizationId === organizationId);
  }

  public static createApiKey(
    organizationId: string,
    name: string,
    scopes: string[]
  ): { apiKey: ApiKeyRecord; secretKey: string } {
    const secretKey = `st_live_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`;
    const apiKey: ApiKeyRecord = {
      id: `key-${Date.now()}`,
      organizationId,
      name,
      keyPrefix: secretKey.substring(0, 12),
      keyHash: `hash_${Date.now()}`,
      permissions: scopes,
      createdAt: new Date().toISOString(),
    };
    API_KEYS_STORE.push(apiKey);
    return { apiKey, secretKey };
  }

  public static revokeApiKey(id: string): boolean {
    const idx = API_KEYS_STORE.findIndex((k) => k.id === id);
    if (idx !== -1) {
      API_KEYS_STORE.splice(idx, 1);
      return true;
    }
    return false;
  }

  public static logApiRequest(log: Omit<ApiUsageLog, "id" | "timestamp">): ApiUsageLog {
    const fullLog: ApiUsageLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    USAGE_LOGS_STORE.unshift(fullLog);
    return fullLog;
  }

  public static getUsageAnalytics(organizationId: string): {
    totalRequests: number;
    errorCount: number;
    avgResponseTimeMs: number;
    logs: ApiUsageLog[];
  } {
    const orgLogs = USAGE_LOGS_STORE.filter((l) => l.organizationId === organizationId);
    const totalRequests = orgLogs.length;
    const errorCount = orgLogs.filter((l) => l.statusCode >= 400).length;
    const avgResponseTimeMs = totalRequests > 0
      ? Math.round(orgLogs.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / totalRequests)
      : 0;

    return { totalRequests, errorCount, avgResponseTimeMs, logs: orgLogs };
  }
}
